import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import PDFParser from "pdf2json";
import tesseract from "node-tesseract-ocr";
import { MongoClient } from "mongodb";

export const runtime = "nodejs"; // ensures Node runtime (not Edge)

// 🔐 Environment variables
const MONGO_URI = process.env.MONGODB_URI!;
const MONGO_DB = process.env.MONGODB_DB!;
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY!;

const client = new MongoClient(MONGO_URI);

export async function POST(req: Request) {
  console.log("🚀 /api/bapa/ingest called", new Date().toISOString());

  try {
    // 1️⃣ Parse incoming file
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file uploaded");

    // 2️⃣ Save file to project-local /temp folder
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = path.join(process.cwd(), "temp");
    await fs.mkdir(tempDir, { recursive: true });

    const tempPath = path.join(tempDir, `${Date.now()}_${file.name}`);
    await fs.writeFile(tempPath, buffer);
    console.log("📄 Saved file:", tempPath);

    // 3️⃣ Try direct PDF text extraction (pdf2json)
    const pdfParser = new PDFParser();
    let text = await new Promise<string>((resolve, reject) => {
      pdfParser.on("pdfParser_dataError", (err) => reject(err.parserError));
      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        const raw = pdfData?.formImage?.Pages?.map((p: any) =>
          p.Texts.map((t: any) => decodeURIComponent(t.R[0].T)).join(" ")
        ).join("\n");
        resolve(raw || "");
      });
      pdfParser.loadPDF(tempPath);
    });

    // 4️⃣ OCR fallback using pdftocairo + tesseract (local path)
    if (text.trim().length < 50) {
      console.warn("⚠️ Text too short — running OCR fallback...");

      const { exec } = await import("child_process");
      const outputDir = tempDir;
      const outputPrefix = path.basename(tempPath).replace(".pdf", "");
      const imagePath = path.join(outputDir, `${outputPrefix}.png`);

      // Convert PDF to PNG using Poppler
      await new Promise<void>((resolve, reject) => {
        exec(
          `/opt/homebrew/bin/pdftocairo -png -singlefile "${tempPath}" "${path.join(
            outputDir,
            outputPrefix
          )}"`,
          (error, stdout, stderr) => {
            console.log("pdftocairo stdout:", stdout);
            console.error("pdftocairo stderr:", stderr);
            if (error) reject(error);
            else resolve();
          }
        );
      });

      // Verify output image exists
      try {
        await fs.access(imagePath);
        console.log("🖼️ Found image for OCR:", imagePath);
      } catch {
        throw new Error(`❌ Image not created at: ${imagePath}`);
      }

      // Run OCR on image
      console.log("🔍 Starting OCR...");
      text = await tesseract.recognize(imagePath, { lang: "eng" });
      console.log("✅ OCR text length:", text.length);
    }

    if (!text || text.trim().length < 50)
      throw new Error("Failed to extract readable text from PDF");

    // 5️⃣ Generate Voyage embedding
    console.log("🧠 Generating Voyage embedding...");
    const embedResp = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "voyage-large-2-instruct",
        input: text.slice(0, 8000),
      }),
    });

    const embedJson = await embedResp.json();
    if (!embedResp.ok)
      throw new Error(embedJson.error?.message || "Voyage embedding failed");
    const embedding = embedJson.data[0].embedding;
    console.log("✅ Embedding generated:", embedding.length, "dimensions");

    // 6️⃣ Generate Voyage summary
    console.log("🪄 Generating Voyage summary...");
    const sumResp = await fetch("https://api.voyageai.com/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "voyage-3",
        input: `Summarize this document in 3 sentences:\n\n${text.slice(0, 4000)}`,
      }),
    });

    const sumJson = await sumResp.json();
    const summary = sumJson.output?.[0]?.text || "No summary available.";

    // 7️⃣ Save to MongoDB
    await client.connect();
    const db = client.db(MONGO_DB);
    const collection = db.collection("bapa_documents");

    const tokenCount = text.split(/\s+/).length;
    const doc = {
      filename: file.name,
      summary,
      token_count: tokenCount,
      embedding,
      content: text,
      uploaded_at: new Date(),
    };

    const result = await collection.insertOne(doc);
    await client.close();

    console.log("✅ Stored in MongoDB:", result.insertedId.toString());

    // 8️⃣ Respond
    return NextResponse.json({
      success: true,
      id: result.insertedId,
      filename: file.name,
      summary,
      token_count: tokenCount,
    });
  } catch (err: any) {
    console.error("❌ Ingest error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

