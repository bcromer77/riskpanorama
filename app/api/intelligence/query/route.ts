import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

export async function POST(req: Request) {
  const { query } = await req.json();

  try {
    await client.connect();
    const db = client.db("rareearthminerals");

    const embeddingResp = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({ model: "voyage-large-2", input: query }),
    });
    const embedding = (await embeddingResp.json()).data[0].embedding;

    const results = await db.collection("documents").aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: embedding,
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
    ]).toArray();

    return NextResponse.json(results);
  } catch (err) {
    console.error("Vector query error:", err);
    return NextResponse.json({ error: "Vector search failed" }, { status: 500 });
  } finally {
    await client.close();
  }
}

