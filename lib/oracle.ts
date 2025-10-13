import { embedText } from "@/lib/vector";
import { MongoClient } from "mongodb";

/**
 * Cascade engine for multi-domain risk discovery.
 * Runs sub-queries that fan out from one user prompt.
 */
export async function runCascade(query: string) {
  const cascades = [
    { theme: "Crisis", subquery: `${query} supply chain disruption or sanctions` },
    { theme: "Exposure", subquery: `${query} impact on retail and manufacturing` },
    { theme: "Opportunity", subquery: `${query} new tech, policy or investment openings` },
  ];

  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB);
  const collection = db.collection("signals");

  const allResults: any[] = [];

  for (const c of cascades) {
    const embedding = await embedText(c.subquery);

    const results = await collection
      .aggregate([
        {
          $vectorSearch: {
            index: "batterypass", // ✅ safe to reuse your working index
            path: "embedding",
            queryVector: embedding,
            numCandidates: 100,
            limit: 3,
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

    allResults.push({ theme: c.theme, query: c.subquery, results });
  }

  await client.close();
  return allResults;
}

