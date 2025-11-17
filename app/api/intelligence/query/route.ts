import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { MongoClient } from "mongodb";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = "rareearthminerals"; // ✅ your Atlas database
const COLLECTION = "documents";      // ✅ your collection with vectors
const INDEX_NAME = "vector_index";   // ✅ confirm in Atlas (Search & Vector tab)

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Missing query text" }, { status: 400 });
    }

    // 🔗 Connect to MongoDB
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const col = db.collection(COLLECTION);

    // 🧮 Create vector embedding (match the model used for data)
    const embed = await openai.embeddings.create({
      model: "text-embedding-3-small", // ✅ same model used when seeding (1536 dims)
      input: query,
    });
    const vector = embed.data[0].embedding;

    // 🧭 Vector Search via MongoDB Atlas
    const results = await col
      .aggregate([
        {
          $vectorSearch: {
            index: INDEX_NAME,
            path: "embedding",
            queryVector: vector,
            numCandidates: 100,
            limit: 8,
          },
        },
        {
          $project: {
            _id: 0,
            text: 1,
            score: { $meta: "vectorSearchScore" },
            metadata: 1,
          },
        },
      ])
      .toArray();

    await client.close();

    return NextResponse.json(results);
  } catch (err: any) {
    console.error("❌ /api/intelligence/query error:", err);
    return NextResponse.json(
      { error: err.message || "Vector search failed" },
      { status: 500 }
    );
  }
}

