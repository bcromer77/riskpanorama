import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGODB_URI!;
const MONGO_DB = process.env.MONGODB_DB!;

export const runtime = "nodejs";

export async function GET() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const signals = await client
      .db(MONGO_DB)
      .collection("emerging_signals")
      .find({})
      .sort({ updated_at: -1 })
      .limit(10)
      .toArray();
    return NextResponse.json({ success: true, signals });
  } catch (e: any) {
    console.error("Signal fetch error:", e);
    return NextResponse.json({ success: false, error: e.message });
  } finally {
    await client.close();
  }
}

