import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongo";
import { embedText } from "@/lib/vector";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const db = await getMongoClient();
    const collection = db.collection("esg_signals");

    // Embed the search query using Voyage Context-3
    const embedding = await embedText(query);

    // Vector Search in MongoDB
    const pipeline = [
      {
        $vectorSearch: {
          index: "signals_vector",
          path: "embedding",
          queryVector: embedding,
          numCandidates: 100,
          limit: 5,
        },
      },
      {
        $project: {
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
    console.error(error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

