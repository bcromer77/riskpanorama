import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import { embedText } from "@/lib/vector";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    // ✅ Connect to MongoDB
    const db = await getDb();
    const collection = db.collection("esg_signals");

    // ✅ Create embedding (Voyage/OpenAI compatible)
    const embedding = await embedText(query);

    // ✅ Vector Search pipeline
    const pipeline = [
      {
        $vectorSearch: {
          index: "signals_vector", // name of your MongoDB Atlas vector index
          path: "embedding",
          queryVector: embedding,
          numCandidates: 100,
          limit: 5,
        },
      },
      {
        $project: {
          _id: 0,
          title: 1,
          country: 1,
          mineral: 1,
          narrative: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ];

    const results = await collection.aggregate(pipeline).toArray();
    return NextResponse.json({ hits: results });
  } catch (error: any) {
    console.error("❌ /api/vector-search error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

