// app/api/bapa/city/report/route.ts
import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const runtime = "nodejs";

const MONGO_URI = process.env.MONGODB_URI!;
const MONGO_DB = process.env.MONGODB_DB!;
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY || "";
const VECTOR_INDEX = "bapa_embedding_index";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

async function embed(text: string): Promise<number[] | null> {
  if (!VOYAGE_API_KEY) return null;
  const r = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${VOYAGE_API_KEY}` },
    body: JSON.stringify({ model: "voyage-large-2-instruct", input: text }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j?.data?.[0]?.embedding ?? null;
}

async function getCachedReport(client: MongoClient, city: string) {
  const db = client.db(MONGO_DB);
  const cacheKey = `cache_${city.toLowerCase()}`;
  const report = await db.collection("city_reports").findOne({
    _id: cacheKey,
    expiresAt: { $gt: new Date() },
  });
  return report?.data;
}

async function cacheReport(client: MongoClient, city: string, data: any) {
  const db = client.db(MONGO_DB);
  const cacheKey = `cache_${city.toLowerCase()}`;
  await db.collection("city_reports").updateOne(
    { _id: cacheKey },
    { $set: { data, expiresAt: new Date(Date.now() + CACHE_TTL_MS) } },
    { upsert: true },
  );
}

export async function POST(req: Request) {
  const client = new MongoClient(MONGO_URI);
  try {
    const { city = "Barcelona" } = await req.json();
    if (!city) throw new Error("Missing city");

    await client.connect();
    const db = client.db(MONGO_DB);

    // 1️⃣ Check cache first
    let report = await getCachedReport(client, city);
    if (report) return NextResponse.json({ success: true, fromCache: true, report });

    // 2️⃣ City-level data
    const since = new Date();
    since.setMonth(since.getMonth() - 6);
    const [signals, deliveries, materials] = await Promise.all([
      db.collection("city_signals").find({ city }).sort({ updated_at: -1 }).limit(12).toArray(),
      db.collection("inventory_shipments").find({ city, delivered_at: { $gte: since } }).sort({ delivered_at: -1 }).limit(50).toArray(),
      db.collection("fleet_materials").find({ city }).project({ _id: 0 }).limit(10).toArray(),
    ]);

    // 3️⃣ Vector search for relevant docs
    const q = `${city} logistics delivery window roadworks water pipes parking capacity Battery Passport EU CBAM`;
    const vector = await embed(q);
    let documents: any[] = [];
    const docsCol = db.collection("bapa_documents");
    if (vector) {
      documents = await docsCol.aggregate([
        {
          $vectorSearch: {
            index: VECTOR_INDEX,
            path: "embedding",
            queryVector: vector,
            numCandidates: 30,
            limit: 6,
          },
        },
        { $project: { _id: 0, filename: 1, summary: 1, score: { $meta: "vectorSearchScore" } } },
      ]).toArray();
    } else {
      documents = await docsCol
        .find({ content: { $regex: city, $options: "i" } })
        .project({ _id: 0, filename: 1, summary: 1 })
        .limit(6)
        .toArray();
    }

    // 4️⃣ Analytics + recommendations
    const deliveryCount = deliveries.length;
    const totalUnits = deliveries.reduce((sum, d) => sum + (d.qty || 0), 0);
    const activeSignals = signals.length;
    const materialList = materials.map((m) => `${m.material} (${Math.round(m.share * 100)}%)`);

    let recommendation = "✅ No disruptions detected.";
    if (signals.some((s) => /water/i.test(s.sector)))
      recommendation = "🚰 Waterworks in progress — recommend early deliveries (before 07:00).";
    else if (signals.some((s) => /parking/i.test(s.sector)))
      recommendation = "🚗 Parking constraints — pre-book loading bays to avoid penalties.";

    const esgDocs = documents.filter((d) => d.score > 0.8 && /ESG|CBAM|passport/i.test(d.summary || ""));
    if (esgDocs.length > 0)
      recommendation += ` | 🔍 ESG Alert (Score ${esgDocs[0].score?.toFixed(2)}): ${esgDocs[0].summary?.slice(0, 100)}...`;

    // 5️⃣ Build report payload
    report = {
      city,
      summary: `${city} — ${activeSignals} signals, ${deliveryCount} deliveries (${totalUnits} units), ${materials.length} fleet exposures.`,
      signals: signals.map((s) => ({
        sector: s.sector,
        signal: s.signal,
        impact: s.impact,
        window: s.window,
      })),
      deliveries: deliveries.map((d) => ({
        sku: d.sku,
        retailer: d.retailer,
        store_name: d.store_name,
        qty: d.qty,
        delivered_at: d.delivered_at,
      })),
      materials: materials.map((m) => ({
        fleet: m.fleet,
        material: m.material,
        component: m.component,
        share: m.share,
      })),
      documents: documents.map((doc) => ({
        filename: doc.filename,
        summary: doc.summary,
        score: doc.score,
      })),
      recommendation,
      generated_at: new Date(),
    };

    await cacheReport(client, city, report);
    return NextResponse.json({ success: true, fromCache: false, report });
  } catch (err: any) {
    console.error("City report error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    await client.close();
  }
}

