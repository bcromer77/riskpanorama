// app/api/commerce/createCheckout/route.ts
import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const runtime = "nodejs";

const MONGO_URI = process.env.MONGODB_URI!;
const MONGO_DB = process.env.MONGODB_DB!;

// Simulate validation + pricing
export async function POST(req: Request) {
  const client = new MongoClient(MONGO_URI);
  try {
    const { buyerId, materialIds = [] } = await req.json();
    if (!materialIds.length) {
      return NextResponse.json({ success: false, error: "No materials provided" }, { status: 400 });
    }

    await client.connect();
    const db = client.db(MONGO_DB);

    const materials = await db
      .collection("materials")
      .find({ materialId: { $in: materialIds } })
      .toArray();

    if (!materials.length) {
      return NextResponse.json({ success: false, error: "Invalid material IDs" }, { status: 404 });
    }

    const total = materials.reduce((sum, m) => sum + (m.price || 0), 0);
    const checkoutId = `ch_${Date.now()}`;

    const shippingOptions = [
      { id: "std", label: "Standard (5 days)", cost: 12 },
      { id: "exp", label: "Express (2 days)", cost: 25 },
    ];

    await db.collection("checkouts").insertOne({
      checkoutId,
      buyerId,
      materialIDs: materialIds,
      status: "pending",
      total,
      currency: "USD",
      shippingOptions,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      checkoutId,
      items: materials.map((m) => ({
        materialId: m.materialId,
        name: m.name,
        price: m.price,
        currency: m.currency,
        badgeColor: m.badgeColor,
      })),
      total,
      shippingOptions,
      paymentMethods: ["stripe_shared_token (simulated)"],
    });
  } catch (err: any) {
    console.error("createCheckout error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    await client.close();
  }
}

