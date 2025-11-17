import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const client = new MongoClient(process.env.MONGODB_URI!);

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query) return NextResponse.json({ error: "No query" }, { status: 400 });

    const embed = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const vector = embed.data[0].embedding;
    await client.connect();
    const db = client.db("rareearthminerals");
    const col = db.collection("documents");

    const results = await col
      .aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: vector,
            numCandidates: 100,
            limit: 5,
          },
        },
        {
          $project: {
            _id: 1,
            filename: 1,
            text: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ])
      .toArray();

    return NextResponse.json(results);
  } catch (err: any) {
    console.error("❌ Query error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await client.close();
  }
}

