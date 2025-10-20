// app/api/reports/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo";

export const runtime = "nodejs";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "riskpanorama");

    const reports = await db
      .collection("reports")
      .find({}, { projection: { fileName: 1, uploadedAt: 1, score: 1, risks: 1 } })
      .sort({ uploadedAt: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json({ success: true, reports });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

