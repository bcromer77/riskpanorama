// app/api/intelligence/agent/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo";
import { embed } from "@/lib/vector";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { instruction } = await req.json();
    if (!instruction) throw new Error("No instruction provided");

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "riskpanorama");

    // 1️⃣ Embed the question
    const queryVector = await embed(instruction);

    // 2️⃣ Search across stored reports (top 5)
    const results = await db
      .collection("reports")
      .aggregate([
        {
          $vectorSearch: {
            index: "reportEmbeddings",
            path: "embedding",
            queryVector,
            numCandidates: 100,
            limit: 5,
          },
        },
        {
          $project: {
            fileName: 1,
            summary: 1,
            tldr: 1,
            risks: 1,
            score: 1,
            uploadedAt: 1,
          },
        },
      ])
      .toArray();

    // 3️⃣ Aggregate risk overlaps
    const mergedRisks: Record<string, string[]> = {};
    for (const doc of results) {
      for (const r of doc.risks || []) {
        if (!mergedRisks[r.title]) mergedRisks[r.title] = [];
        mergedRisks[r.title].push(doc.fileName);
      }
    }

    const overlaps = Object.entries(mergedRisks)
      .filter(([_, files]) => files.length > 1)
      .map(([title, files]) => ({
        title,
        overlapCount: files.length,
        files,
      }));

    return NextResponse.json({
      success: true,
      query: instruction,
      results,
      overlaps,
    });
  } catch (err: any) {
    console.error("❌ /agent error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

