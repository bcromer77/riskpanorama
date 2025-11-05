import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const client = new MongoClient(MONGODB_URI);

export async function GET(req: NextRequest) {
  try {
    const researcher = req.nextUrl.searchParams.get("researcher") || "galina-kennedy";
    const title = req.nextUrl.searchParams.get("title");

    await client.connect();
    const db = client.db("veracity101");
    const col = db.collection("summaries");

    const doc = await col.findOne({ researcher, title });
    if (!doc) return NextResponse.json({ summaries: {} });

    return NextResponse.json({ summaries: doc.summaries || {} });
  } catch (err: any) {
    console.error("GET /api/summaries error:", err);
    return NextResponse.json({ error: "Failed to fetch summaries" }, { status: 500 });
  } finally {
    await client.close();
  }
}

