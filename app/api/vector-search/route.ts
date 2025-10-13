import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { embedText } from "@/lib/vector";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ ok: false, error: "Missing query" });
    }

    console.log("🧠 Received query:", query);

    // Connect to Mongo
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection("signals");

    // Create embedding with Voyage
    const embedding = await embedText(query);
    console.log("🧠 Generated embedding length:", embedding.length);

    // Vector search
    const results = await collection
      .aggregate([
        {
          $vectorSearch: {
            index: "batterypass", // ✅ Use your 1024-dimension working index
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
            region: 1,
            sector: 1,
            risk_type: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ])
      .toArray();

    console.log("✅ Query results count:", results.length);

    await client.close();
    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    console.error("❌ Vector search error:", err);
    return NextResponse.json({ ok: false, error: err.message || "Unknown error" });
  }
}

