// app/api/commerce/completeCheckout/route.ts
import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const runtime = "nodejs";

const MONGO_URI = process.env.MONGODB_URI!;
const MONGO_DB = process.env.MONGODB_DB!;

export async function POST(req: Request) {
  const client = new MongoClient(MONGO_URI);
  try {
    const { checkoutId, paymentToken = "tok_demo_stripe_shared_123" } = await req.json();
    if (!checkoutId) throw new Error("Missing checkoutId");

    await client.connect();
    const db = client.db(MONGO_DB);

    const checkout = await db.collection("checkouts").findOne({ checkoutId });
    if (!checkout) throw new Error("Checkout not found");

    const material = await db.collection("materials").findOne({ materialId: checkout.materialIDs[0] });
    const esg = await db.collection("ESG_Scorecards").findOne({
      materialId: checkout.materialIDs[0],
      supplierId: checkout.supplierId ?? material?.supplierId,
    });

    const orderId = `ord_${Date.now()}`;
    await db.collection("orders").insertOne({
      orderId,
      checkoutId,
      paymentToken,
      status: "paid",
      createdAt: new Date(),
      ESGbadgeSnapshot: {
        materialId: material?.materialId,
        badgeColor: esg?.badgeColor ?? material?.badgeColor ?? "unknown",
        overall: esg?.overall ?? null,
        carbonScore: esg?.carbonScore ?? null,
        socialScore: esg?.socialScore ?? null,
        governanceScore: esg?.governanceScore ?? null,
      },
    });

    await db.collection("checkouts").updateOne({ checkoutId }, { $set: { status: "completed" } });

    return NextResponse.json({
      success: true,
      orderId,
      message: "Checkout completed and order recorded.",
    });
  } catch (err: any) {
    console.error("completeCheckout error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    await client.close();
  }
}

