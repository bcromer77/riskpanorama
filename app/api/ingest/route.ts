import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import pdf from "pdf-parse";

export const runtime = "nodejs";

const MONGODB_URI = process.env.MONGODB_URI!;
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY!;
const client = new MongoClient(MONGODB_URI);

// --- Helper: Split text into chunks (~1000 chars) ---
function chunkText(text: string, maxChars = 1000) {
  const paragraphs = text.split(/\n{2,}/);
  const chunks: { text: string }[] = [];
  let current = "";
  for (const p of paragraphs) {
    if ((current + p).length > maxChars) {
      chunks.push({ text: current });
      current = p;
    } else {
      current += (current ? "\n\n" : "") + p;
    }
  }
  if (current) chunks.push({ text: current });
  return chunks;
}

// --- Helper: Get embeddings from VoyageAI ---
async function embedBatch(chunks: string[]): Promise<number[][]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "voyage-large-2",
      input: chunks,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`VoyageAI error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.data.map((d: any) => d.embedding);
}

export async function POST(req: NextRequest) {
  let mongoConnected = false;
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) throw new Error("No file provided");

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);
    const text = data.text.trim();
    if (!text || text.length < 100) throw new Error("No readable text found");

    const chunks = chunkText(text);
    console.log(`✅ Extracted ${chunks.length} chunks`);

    // --- Embed chunks using Voyage ---
    const embeddings = await embedBatch(chunks.map((c) => c.text));
    console.log("✅ Embeddings generated:", embeddings.length);

    await client.connect();
    mongoConnected = true;
    const db = client.db("veracity101");
    const col = db.collection("talk_chunks");

    const docs = chunks.map((c, i) => ({
      text: c.text,
      embedding: embeddings[i],
      idx: i,
      createdAt: new Date(),
      fileName: file.name,
    }));

    const result = await col.insertMany(docs);

    return NextResponse.json({
      success: true,
      message: "Document embedded and stored successfully",
      fileName: file.name,
      chunksProcessed: docs.length,
      insertedCount: result.insertedCount,
    });
  } catch (err: any) {
    console.error("Ingest error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to embed document", details: err.message },
      { status: 500 }
    );
  } finally {
    if (mongoConnected) await client.close();
  }
}

