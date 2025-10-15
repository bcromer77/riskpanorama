import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export const runtime = "nodejs";

function calcTax(subtotal: number) { return +(subtotal * 0.07).toFixed(2); }
function esgTrustFee(total: number) { return Math.max(total * 0.02, 25); }

export async function PATCH(req: Request) {
  try {
    const { checkoutId, items, shippingId } = await req.json() as {
      checkoutId: string;
      items?: Array<{ materialId: string; qty: number }>;
      shippingId?: string;
    };

    const db = await getDb();
    const co = await db.collection("checkouts").findOne({ checkoutId });
    if (!co) return NextResponse.json({ error: "checkout not found" }, { status: 404 });
    if (co.status !== "open" && co.status !== "updated") {
      return NextResponse.json({ error: "checkout not open" }, { status: 400 });
    }

    let nextItems = co.items;
    if (items) {
      nextItems = items;
    }
    const mats = await db.collection("materials").find({ materialId: { $in: nextItems.map((i: any) => i.materialId) } }).toArray();

    // recompute subtotal
    const lines = nextItems.map((i: any) => {
      const m = mats.find((mm: any) => mm.materialId === i.materialId)!;
      const unit = Number(m.price || 0);
      const lineTotal = +(unit * i.qty).toFixed(2);
      return { materialId: i.materialId, name: m.name, unit, qty: i.qty, lineTotal, currency: m.currency || co.currency || "USD" };
    });

    const subtotal = +lines.reduce((a, b) => a + b.lineTotal, 0).toFixed(2);
    const tax = calcTax(subtotal);

    const shippingOptions = co.shippingOptions || [];
    const chosen = shippingId ? shippingOptions.find((s: any) => s.id === shippingId) : co.chosenShipping;
    const shipCost = chosen?.cost || (shippingOptions[0]?.cost ?? 0);

    const displayTotal = +(subtotal + tax + shipCost + esgTrustFee(subtotal + tax)).toFixed(2);

    await db.collection("checkouts").updateOne(
      { checkoutId },
      {
        $set: {
          status: "updated",
          items: nextItems,
          subtotal,
          tax,
          chosenShipping: chosen || null,
          displayTotal,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      checkoutId,
      items: lines,
      subtotal,
      tax,
      shippingSelected: chosen || null,
      total: displayTotal,
      currency: lines[0]?.currency || co.currency || "USD",
      status: "updated"
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

