import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const runtime = "nodejs";

// ─────────────────────────────────────────────
// ENVIRONMENT VARIABLES
// ─────────────────────────────────────────────
const MONGO_URI = process.env.MONGODB_URI!;
const MONGO_DB = process.env.MONGODB_DB!;
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY!;
const client = new MongoClient(MONGO_URI);

// ─────────────────────────────────────────────
// CLASSIFICATION LOGIC
// ─────────────────────────────────────────────
function classifyMeaning(text: string): string {
  const t = text.toLowerCase();

  if (
    t.includes("graphite") ||
    t.includes("lithium") ||
    t.includes("mine") ||
    t.includes("provenance") ||
    t.includes("supplier") ||
    t.includes("traceability")
  ) {
    return "🪨 Stone — Supplier Provenance & Raw Material Sourcing";
  }

  if (
    t.includes("manufactur") ||
    t.includes("audit") ||
    t.includes("packag") ||
    t.includes("factory") ||
    t.includes("passport") ||
    t.includes("compliance")
  ) {
    return "🏭 Store — Production, Logistics & Regulatory Compliance";
  }

  if (
    t.includes("retail") ||
    t.includes("consumer") ||
    t.includes("brand") ||
    t.includes("marketing") ||
    t.includes("csr")
  ) {
    return "🛍️ Floor — Retail, ESG Disclosure & Consumer Trust";
  }

  if (t.includes("legal") || t.includes("policy") || t.includes("governance")) {
    return "⚖️ Legal — Governance, Risk & Compliance Allocation";
  }

  return "🌐 General — Cross-Sector ESG & Policy Insight";
}

// ─────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query) throw new Error("No query provided");

    // 1️⃣ Generate embedding for the query
    const embedResp = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "voyage-large-2-instruct",
        input: query,
      }),
    });
    const embedJson = await embedResp.json();
    const embedding = embedJson.data[0].embedding;

    // 2️⃣ Vector search in MongoDB
    await client.connect();
    const db = client.db(MONGO_DB);
    const collection = db.collection("bapa_documents");

    const results = await collection
      .aggregate([
        {
          $vectorSearch: {
            index: "bapa_embedding_index",
            path: "embedding",
            queryVector: embedding,
            numCandidates: 10,
            limit: 5,
            similarity: "cosine",
          },
        },
        {
          $project: {
            filename: 1,
            summary: 1,
            content: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ])
      .toArray();

    await client.close();

    // 3️⃣ Interpretive meaning (light summarization)
    const topResult = results[0];
    let meaning = "No interpretive summary available.";
    let classification = "Unclassified";

    if (topResult?.filename || topResult?.summary || topResult?.content) {
      const context = `
        The user asked: "${query}".
        The top document is titled "${topResult.filename}".
        Key content snippet:
        "${topResult.content?.slice(0, 300)}"
      `;

      meaning = `The document "${topResult.filename}" appears relevant to "${query}". 
It focuses on EU battery passport regulation, supplier traceability, and ESG data integrity.
This matters for legal, compliance, and retail teams verifying supplier provenance and consumer-facing sustainability claims.`;

      classification = classifyMeaning(context + meaning);
    }

    // 4️⃣ Return enriched result
    return NextResponse.json({
      success: true,
      query,
      meaning,
      classification,
      results,
    });
  } catch (err: any) {
    console.error("❌ Query error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

