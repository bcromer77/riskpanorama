// app/api/bapa/sku/report/route.ts
import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const runtime = "nodejs";

const MONGO_URI = process.env.MONGODB_URI!;
const MONGO_DB = process.env.MONGODB_DB!;
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY!;
const INDEX_NAME = "bapa_embedding_index";

type ReqBody = {
  sku: string;                 // free text: "Benkia 18650 9900mAh"
  brand?: string;              // optional hint (e.g. "Benkia")
  capacity_label_mAh?: number; // optional label capacity (e.g. 9900)
};

type MetricSet = {
  // all unitless (0–1) except where noted
  cathode_overhang_defect_rate: number;   // e.g. 0.08 (8%)
  edge_alignment_variance: number;        // normalized 0–1
  capacity_ratio_vs_label: number;        // delivered / label (0–1+)
  negative_anode_overhang_rate: number;   // e.g. 0.15
  traceability_gap: number;               // 0 (good) .. 1 (bad)
  tier: "OEM" | "Rewrap" | "Counterfeit";
};

// === Lumafield-anchored brand baselines (condensed from report) ===
const BRAND_BASELINES: Record<string, MetricSet> = {
  // OEM
  murata:   { cathode_overhang_defect_rate: 0.00, edge_alignment_variance: 0.10, capacity_ratio_vs_label: 0.89, negative_anode_overhang_rate: 0.00, traceability_gap: 0.10, tier: "OEM" },
  samsung:  { cathode_overhang_defect_rate: 0.00, edge_alignment_variance: 0.09, capacity_ratio_vs_label: 0.84, negative_anode_overhang_rate: 0.00, traceability_gap: 0.10, tier: "OEM" },
  panasonic:{ cathode_overhang_defect_rate: 0.00, edge_alignment_variance: 0.12, capacity_ratio_vs_label: 0.78, negative_anode_overhang_rate: 0.00, traceability_gap: 0.10, tier: "OEM" },

  // Rewrap
  efest:    { cathode_overhang_defect_rate: 0.00, edge_alignment_variance: 0.18, capacity_ratio_vs_label: 0.76, negative_anode_overhang_rate: 0.00, traceability_gap: 0.30, tier: "Rewrap" },
  vapcell:  { cathode_overhang_defect_rate: 0.00, edge_alignment_variance: 0.18, capacity_ratio_vs_label: 0.76, negative_anode_overhang_rate: 0.00, traceability_gap: 0.30, tier: "Rewrap" },
  trustfire:{ cathode_overhang_defect_rate: 0.00, edge_alignment_variance: 0.22, capacity_ratio_vs_label: 0.85, negative_anode_overhang_rate: 0.00, traceability_gap: 0.35, tier: "Rewrap" },

  // Low-cost / Counterfeit
  treasurecase:{ cathode_overhang_defect_rate: 0.08, edge_alignment_variance: 0.50, capacity_ratio_vs_label: 0.39, negative_anode_overhang_rate: 0.125, traceability_gap: 0.80, tier: "Counterfeit" },
  benkia:      { cathode_overhang_defect_rate: 0.15, edge_alignment_variance: 0.40, capacity_ratio_vs_label: 0.13, negative_anode_overhang_rate: 0.15,  traceability_gap: 0.85, tier: "Counterfeit" },
  soocool:     { cathode_overhang_defect_rate: 0.08, edge_alignment_variance: 0.38, capacity_ratio_vs_label: 0.87, negative_anode_overhang_rate: 0.01,  traceability_gap: 0.70, tier: "Counterfeit" },
  maxiaeon:    { cathode_overhang_defect_rate: 0.15, edge_alignment_variance: 0.69, capacity_ratio_vs_label: 0.12, negative_anode_overhang_rate: 0.15,  traceability_gap: 0.90, tier: "Counterfeit" },
};

function brandKey(s?: string) {
  return (s || "").toLowerCase().trim();
}

// Normalize 0–1 helpers (kept simple for demo)
function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

// === Battery Risk Score (0–100; higher = riskier) ===
// weights reflect “Recall & Return” leverage points
function computeBRS(m: MetricSet): { score: number; contributions: Record<string, number> } {
  // turn capacity *deficit* into risk: (1 - capacity_ratio)
  const capDef = clamp01(1 - m.capacity_ratio_vs_label);

  const w = {
    overhangDefects: 0.35,
    capacityGap:     0.30,
    alignment:       0.20,
    negOverhang:     0.10,
    traceability:    0.05,
  };

  const parts = {
    overhangDefects: m.cathode_overhang_defect_rate * w.overhangDefects,
    capacityGap:     capDef * w.capacityGap,
    alignment:       clamp01(m.edge_alignment_variance) * w.alignment,
    negOverhang:     clamp01(m.negative_anode_overhang_rate) * w.negOverhang,
    traceability:    clamp01(m.traceability_gap) * w.traceability,
  };

  const risk01 = Object.values(parts).reduce((a, b) => a + b, 0); // 0..1
  return { score: Math.round(risk01 * 100), contributions: parts };
}

async function embed(text: string): Promise<number[]> {
  const resp = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${VOYAGE_API_KEY}` },
    body: JSON.stringify({ model: "voyage-large-2-instruct", input: text }),
  });
  const json = await resp.json();
  return json.data[0].embedding;
}

export async function POST(req: Request) {
  const client = new MongoClient(MONGO_URI);
  try {
    const body = (await req.json()) as ReqBody;
    if (!body?.sku) throw new Error("Missing 'sku'");

    // 1) Build semantic query text (SKU + hints)
    const queryText = [
      body.sku,
      body.brand ? `brand ${body.brand}` : "",
      body.capacity_label_mAh ? `label capacity ${body.capacity_label_mAh} mAh` : "",
      "battery passport compliance ESG safety recall graphite origin alignment anode overhang defect"
    ].filter(Boolean).join(" ");

    const vector = await embed(queryText);

    // 2) Vector search your bapa_documents for context (top 5)
    await client.connect();
    const col = client.db(MONGO_DB).collection("bapa_documents");
    const matches = await col.aggregate([
      {
        $vectorSearch: {
          index: INDEX_NAME,
          path: "embedding",
          queryVector: vector,
          numCandidates: 20,
          limit: 5,
          similarity: "cosine",
        },
      },
      { $project: { filename: 1, summary: 1, content: { $ifNull: ["$content", ""] }, score: { $meta: "vectorSearchScore" } } },
    ]).toArray();

    // 3) Pick metric baseline (brand → metric set). Fallback to “rewrap-ish”.
    const m =
      BRAND_BASELINES[brandKey(body.brand)] ??
      // heuristic brand sniff from SKU
      Object.keys(BRAND_BASELINES).find((k) => brandKey(body.sku).includes(k))
        ? BRAND_BASELINES[Object.keys(BRAND_BASELINES).find((k) => brandKey(body.sku).includes(k)) as string]
        : { cathode_overhang_defect_rate: 0.02, edge_alignment_variance: 0.22, capacity_ratio_vs_label: 0.70, negative_anode_overhang_rate: 0.02, traceability_gap: 0.40, tier: "Rewrap" as const };

    // if user specified a label capacity, we can slightly adjust capacity_ratio
    let capacity_ratio_vs_label = m.capacity_ratio_vs_label;
    if (body.capacity_label_mAh && /(\d{3,5})\s?mAh/i.test(body.sku)) {
      const mAh = Number(RegExp.$1);
      if (mAh > 0 && body.capacity_label_mAh > 0) {
        // small nudge if label in SKU contradicts provided label
        const ratio = mAh / body.capacity_label_mAh;
        capacity_ratio_vs_label = clamp01(Math.min(m.capacity_ratio_vs_label, ratio));
      }
    }

    const finalMetrics: MetricSet = { ...m, capacity_ratio_vs_label };

    const { score: brs, contributions } = computeBRS(finalMetrics);

    // 4) Simple classification lane
    const classification =
      finalMetrics.tier === "OEM" ? "🧱 Stone — Supplier Quality Verified (OEM Baseline)"
      : finalMetrics.tier === "Rewrap" ? "🏭 Store — Manufacturing & Regulatory Exposure"
      : "🛍️ Floor — Consumer & Brand Risk";

    // 5) Narrative meaning (short)
    const meaning = (() => {
      const bits: string[] = [];
      if (finalMetrics.cathode_overhang_defect_rate >= 0.08) bits.push("cathode overhang defects present in ~8–15% of sampled cells");
      if (1 - finalMetrics.capacity_ratio_vs_label >= 0.5) bits.push("extreme label-vs-measured capacity gap");
      if (finalMetrics.edge_alignment_variance >= 0.4) bits.push("poor edge alignment vs OEM baseline");
      if (finalMetrics.traceability_gap >= 0.7) bits.push("traceability/documentation gaps likely (graphite origin, lot data)");
      if (!bits.length) return "OEM-like quality signals; low inherent safety risk based on Lumafield benchmarks.";
      return `Risk drivers: ${bits.join("; ")}. Recommend CT audit + Battery Passport field completion.`;
    })();

    // 6) Build the Compliance Card payload
    const compliance_card = {
      sku: body.sku,
      brand: body.brand ?? (Object.keys(BRAND_BASELINES).find((k) => brandKey(body.sku).includes(k)) || "Unknown"),
      tier: finalMetrics.tier,
      battery_risk_score: brs, // 0..100 (High = worse)
      classification,
      panels: {
        battery_passport: {
          missing_fields: finalMetrics.traceability_gap >= 0.7 ? ["origin.trace.graphite", "recycled_content", "second_life"] : ["recycled_content"],
          traceability_gap: finalMetrics.traceability_gap,
        },
        esg_supply_chain: {
          graphite_origin_candidates: ["Mozambique", "China"], // from report
          risk_level: finalMetrics.traceability_gap >= 0.7 ? "High" : "Moderate",
        },
        consumer_safety: {
          cathode_overhang_defect_rate: finalMetrics.cathode_overhang_defect_rate,
          edge_alignment_variance: finalMetrics.edge_alignment_variance,
          capacity_ratio_vs_label: finalMetrics.capacity_ratio_vs_label,
          negative_anode_overhang_rate: finalMetrics.negative_anode_overhang_rate,
        },
        brand_reputation: {
          recall_pattern_hint: "CPSC recalls skew to Li-ion; escalate monitoring for marketplace listings",
        },
      },
      contributions,
      meaning,
      sources: matches.map((m) => ({
        filename: m.filename,
        summary: m.summary ?? "No summary.",
        score: m.score,
      })),
    };

    return NextResponse.json({ success: true, compliance_card });
  } catch (e: any) {
    console.error("SKU report error:", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  } finally {
    try { await client.close(); } catch {}
  }
}

