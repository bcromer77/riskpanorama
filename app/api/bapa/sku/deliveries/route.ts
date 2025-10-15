import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const runtime = "nodejs";

const MONGO_URI = process.env.MONGODB_URI!;
const MONGO_DB = process.env.MONGODB_DB!;
const client = new MongoClient(MONGO_URI);

export async function POST(req: Request) {
  try {
    const { sku, lookback_quarters = 2 } = await req.json();
    if (!sku) throw new Error("Missing sku");

    const months = Number(lookback_quarters) * 3 || 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    await client.connect();
    const db = client.db(MONGO_DB);
    const col = db.collection("inventory_shipments");

    const rows = await col
      .aggregate([
        { $match: { sku, delivered_at: { $gte: startDate } } },
        {
          $group: {
            _id: { store_id: "$store_id", store_name: "$store_name" },
            total_qty: { $sum: "$qty" },
            last_delivery: { $max: "$delivered_at" },
          },
        },
        {
          $project: {
            _id: 0,
            store_id: "$_id.store_id",
            store_name: "$_id.store_name",
            total_qty: 1,
            last_delivery: 1,
          },
        },
        { $sort: { last_delivery: -1 } },
        { $limit: 25 },
      ])
      .toArray();

    await client.close();
    return NextResponse.json({ success: true, rows });
  } catch (err: any) {
    console.error("Deliveries error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

