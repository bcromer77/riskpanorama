import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { checkoutId } = await req.json() as { checkoutId: string };
    const db = await getDb();
    const co = await db.collection("checkouts").findOne({ checkoutId });
    if (!co) return NextResponse.json({ error: "checkout not found" }, { status: 404 });
    if (co.status === "completed") {
      return NextResponse.json({ error: "cannot cancel a completed checkout" }, { status: 400 });
    }
    await db.collection("checkouts").updateOne({ checkoutId }, { $set: { status: "cancelled", cancelledAt: new Date() } });
    return NextResponse.json({ checkoutId, status: "cancelled" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

