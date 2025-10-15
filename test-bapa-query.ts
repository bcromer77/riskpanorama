/**
 * 🧪 BAPA Query Test Script
 * -------------------------
 * Run this script to confirm that:
 *  1. Your embeddings exist in MongoDB.
 *  2. Your Mongo vector search index works correctly.
 *  3. Your Voyage API key can embed queries.
 */

import { MongoClient } from "mongodb";
import fetch from "node-fetch"; // ensure available via pnpm add node-fetch if needed
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI!;
const MONGO_DB = process.env.MONGODB_DB!;
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY!;
const COLLECTION = "bapa_documents";

async function runTest(query: string) {
  console.log(`\n🔍 Testing query: "${query}"`);
  const client = new MongoClient(MONGO_URI);

  try {
    // 1️⃣ Generate embedding for the query
    console.log("→ Creating Voyage embedding...");
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
    const queryVector = embedJson.data?.[0]?.embedding;

    if (!queryVector) throw new Error("No embedding returned from Voyage API");

    // 2️⃣ Connect to MongoDB
    await client.connect();
    const db = client.db(MONGO_DB);
    const collection = db.collection(COLLECTION);

    // 3️⃣ Perform vector search
    console.log("→ Running MongoDB vector search...");
    const results = await collection
      .aggregate([
        {
          $vectorSearch: {
            index: "bapa_embedding_index",
            path: "embedding",
            queryVector,
            numCandidates: 50,
            limit: 5,
          },
        },
        {
          $project: {
            filename: 1,
            summary: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ])
      .toArray();

    // 4️⃣ Display results
    if (results.length === 0) {
      console.warn("⚠️ No matches found — check if embeddings exist in Mongo.");
    } else {
      console.log(`✅ Found ${results.length} result(s):\n`);
      results.forEach((r, i) => {
        console.log(
          `${i + 1}. ${r.filename}\n   → ${r.summary}\n   (score: ${r.score.toFixed(
            3
          )})\n`
        );
      });
    }
  } catch (err) {
    console.error("❌ Test failed:", err);
  } finally {
    await client.close();
  }
}

runTest("China graphite").then(() => process.exit());

