import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { pipeline, env } from "@xenova/transformers";

export const runtime = "nodejs";
env.allowLocalModels = false;

// -----------------------------------------------------------------------------
//  MongoDB connection
// -----------------------------------------------------------------------------
const client = new MongoClient(process.env.MONGODB_URI || "");
async function getCollection() {
  if (!client.topology?.isConnected()) await client.connect();
  const db = client.db("rareearthminerals");
  return db.collection("documents");
}

// -----------------------------------------------------------------------------
//  Smart summary fallback
// -----------------------------------------------------------------------------
function generateSmartSummary(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const key = sentences
    .filter((s) =>
      /(risk|battery|CBAM|compliance|origin|supplier|passport|thermal|chain)/i.test(s)
    )
    .slice(0, 5);
  return key.length ? key.join(" ") : text.slice(0, 400) + "…";
}

// -----------------------------------------------------------------------------
//  POST route — runs vector search + AI summary
// -----------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body.query || body.text || "";
    if (!query || query.length < 5) throw new Error("Query too short");

    // 1️⃣ Create embedding for query text
    const embedResp = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "voyage-large-2",
        input: query.slice(0, 8000),
      }),
    });
    const embedData = await embedResp.json();
    const queryEmbedding = embedData.data?.[0]?.embedding;
    if (!queryEmbedding) throw new Error("Failed to embed query");

    // 2️⃣ Perform MongoDB vector search
    const collection = await getCollection();
    const results = await collection
      .aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: 50,
            limit: 5,
          },
        },
        {
          $project: {
            text: 1,
            metadata: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ])
      .toArray();

    if (!results.length) {
      return NextResponse.json({
        success: true,
        summary: "No matching filings or reports found.",
        risks: [],
      });
    }

    // 3️⃣ Concatenate top-matched text for summarization
    const combinedText = results.map((r) => r.text).join(" ");

    // 4️⃣ Try to summarize with local model, fallback if needed
    let summary = "";
    try {
      const summarizer = await pipeline("summarization", "Xenova/distilbart-cnn-12-6");
      const output = await summarizer(combinedText.slice(0, 4000));
      summary = output[0]?.summary_text || "";
    } catch (err) {
      console.warn("⚠️ Summarizer failed, fallback used:", err);
      summary = generateSmartSummary(combinedText);
    }

    // 5️⃣ Basic risk scoring (mock categories)
    const risks = results.map((r) => ({
      title: r.metadata?.law || "Unclassified Risk",
      body: r.text.slice(0, 180) + "…",
      score: r.score,
      country: r.metadata?.country || "Unknown",
    }));

    return NextResponse.json({
      success: true,
      summary,
      tldr: summary.slice(0, 300),
      risks,
    });
  } catch (err: any) {
    console.error("❌ /api/bapa/query error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Processing failed" },
      { status: 500 }
    );
  }
}

