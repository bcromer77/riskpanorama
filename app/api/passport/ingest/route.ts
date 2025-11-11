// app/api/passport/ingest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo";
import { BatteryPassportDoc } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as Partial<BatteryPassportDoc>;

    // minimal guard
    if (!payload.battery_id || !payload.category) {
      return NextResponse.json(
        { error: "battery_id and category are required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const db = await getDb();
    const coll = db.collection<BatteryPassportDoc>("battery_passports");

    // what we will store
    const doc: Partial<BatteryPassportDoc> = {
      ...payload,
      access: payload.access || { default_tier: "public" },
      created_at: payload.created_at || now,
      updated_at: now,
    };

    // idempotent on battery_id
    const existing = await coll.findOne({ battery_id: payload.battery_id });

    let _id: ObjectId;
    if (existing?._id) {
      await coll.updateOne({ _id: existing._id }, { $set: doc });
      _id = existing._id as ObjectId;
    } else {
      const ins = await coll.insertOne(doc as any);
      _id = ins.insertedId as ObjectId;
    }

    const base =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
    const publicUrl = `${base}/passport/${_id.toString()}`;

    return NextResponse.json({
      id: _id.toString(),
      url: publicUrl,
      message: "Passport ingested",
    });
  } catch (err) {
    console.error("ingest passport error:", err);
    return NextResponse.json(
      { error: "Failed to ingest passport" },
      { status: 500 }
    );
  }
}

