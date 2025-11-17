import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import OpenAI from "openai";

const client = new MongoClient(process.env.MONGODB_URI!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query) return NextResponse.json([], { status: 200 });

    await client.connect();
    const db = client.db("rareearthminerals");
    const col = db.collection("signals");

    // 🧠 Generate an embedding for the query text
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const vector = embedding.data[0].embedding;

    // 🔍 Run MongoDB Atlas Vector Search
    const results = await col
      .aggregate([
        {
          $vectorSearch: {
            index: "vector_index_3",
            path: "embedding",
            queryVector: vector,
            numCandidates: 100,
            limit: 10,
          },
        },
        {
          $project: {
            _id: 0,
            title: 1,
            source: 1,
            date: 1,
            region: 1,
            summary: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
        { $sort: { date: -1 } },
      ])
      .toArray();

    return NextResponse.json(results);
  } catch (err) {
    console.error("❌ /api/signals/query error:", err);
    return NextResponse.json(
      { error: "Failed to fetch signals" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

