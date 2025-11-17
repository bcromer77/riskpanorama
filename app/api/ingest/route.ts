import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import OpenAI from "openai";
import pdfParse from "pdf-parse"; // <— npm install pdf-parse

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const client = new MongoClient(process.env.MONGODB_URI!);

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const parsed = await pdfParse(buf);
    const text = parsed.text.slice(0, 8000); // keep it lightweight

    if (!text || text.length < 50)
      return NextResponse.json(
        { error: "Could not extract readable text" },
        { status: 400 }
      );

    // Summarise content intelligently
    const summaryRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a compliance analyst extracting insights from supplier PDFs. Write 3–5 factual sentences on ESG, provenance, chemistry, or risk relevance.",
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const summary =
      summaryRes.choices[0]?.message?.content ??
      "No insights extracted from PDF.";

    const embed = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: summary,
    });

    await client.connect();
    const db = client.db("rareearthminerals");
    const col = db.collection("documents");

    const doc = {
      filename: file.name,
      text: summary,
      embedding: embed.data[0].embedding,
      createdAt: new Date(),
    };
    const result = await col.insertOne(doc);

    return NextResponse.json({
      message: "✅ PDF parsed & embedded",
      id: result.insertedId.toString(),
      preview: summary.slice(0, 200),
    });
  } catch (err: any) {
    console.error("❌ Ingest error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await client.close();
  }
}

