// app/api/intelligence/insight/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";           // your helper
import { embed } from "@/lib/vector";          // your query embedding helper (Voyage/OpenAI); fallback handled

export const runtime = "nodejs";

type InsightDoc = {
  _id: string;
  title?: string;
  filename?: string;
  summary?: string;
  esgScore?: number;          // 0-100
  badgeColor?: "green" | "amber" | "red";
  sim?: number;
  tags?: string[];
  savingsHint?: string;       // e.g. "$50k recall savings"
  source?: string;            // "document" | "policy" | "report"
};

function toBadge(score = 70): InsightDoc["badgeColor"] {
  if (score >= 80) return "green";
  if (score >= 50) return "amber";
  return "red";
}

export async function POST(req: Request) {
  try {
    const { query, limit = 12 } = (await req.json()) as { query: string; limit?: number };
    if (!query || !query.trim()) {
      return NextResponse.json({ success: true, items: [] });
    }

    const db = await getDb();
    const col = db.collection("documents");      // <- your vectorized PDFs live here (from /api/bapa/query)
    let items: InsightDoc[] = [];

    // Try vector search first
    try {
      const qvec = await embed(query);           // returns number[]
      const agg = await col.aggregate([
        {
          $vectorSearch: {
            index: "esg_embeddings",
            path: "embedding",
            queryVector: qvec,
            numCandidates: Math.max(100, limit * 10),
            limit,
          },
        },
        {
          $project: {
            _id: 0,
            id: "$_id",
            title: { $ifNull: ["$title", "$filename"] },
            filename: 1,
            summary: 1,
            esgScore: { $ifNull: ["$esgScore", 72] },
            tags: 1,
            savingsHint: 1,
            source: { $ifNull: ["$source", "document"] },
            sim: { $meta: "vectorSearchScore" },
          },
        },
      ]).toArray();

      items = agg.map((d: any) => ({
        _id: d.id?.toString?.() || "",
        title: d.title,
        filename: d.filename,
        summary: d.summary,
        esgScore: d.esgScore,
        badgeColor: toBadge(d.esgScore),
        tags: d.tags ?? [],
        savingsHint: d.savingsHint,
        sim: Number(d.sim?.toFixed?.(2) ?? 0.8),
        source: d.source,
      }));
    } catch {
      // Fallback: text search (regex) for demo resilience
      const rx = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const docs = await col
        .find({ $or: [{ title: rx }, { filename: rx }, { summary: rx }, { text: rx }] })
        .limit(limit)
        .project({
          _id: 1,
          title: 1,
          filename: 1,
          summary: 1,
          esgScore: 1,
          tags: 1,
          savingsHint: 1,
          source: 1,
        })
        .toArray();

      items = docs.map((d: any) => ({
        _id: d._id?.toString?.(),
        title: d.title ?? d.filename ?? "Untitled",
        filename: d.filename,
        summary: d.summary ?? "No summary available.",
        esgScore: d.esgScore ?? 72,
        badgeColor: toBadge(d.esgScore ?? 72),
        tags: d.tags ?? [],
        savingsHint: d.savingsHint,
        sim: 0.6, // heuristic in fallback
        source: d.source ?? "document",
      }));
    }

    return NextResponse.json({ success: true, items });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "search_failed" }, { status: 500 });
  }
}

