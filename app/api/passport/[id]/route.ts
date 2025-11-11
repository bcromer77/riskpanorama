// app/api/passport/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo";
import { BatteryPassportDoc, AccessTier } from "@/lib/types";

function filterByRole(doc: BatteryPassportDoc, role: AccessTier) {
  const clone: any = JSON.parse(JSON.stringify(doc));
  delete clone._id;

  // always safe for public
  const makePublic = () => {
    if (clone.performance?.dynamic) {
      delete clone.performance.dynamic;
    }
    return clone;
  };

  if (role === "public") return makePublic();
  if (role === "legitimate_interest") return clone;
  if (role === "authority" || role === "commission") return clone;

  return makePublic();
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb();
    const coll = db.collection<BatteryPassportDoc>("battery_passports");

    const doc = await coll.findOne({ _id: new ObjectId(params.id) });
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const roleParam = (url.searchParams.get("role") || "").trim() as AccessTier;
    const roleHeader = (req.headers.get("x-passport-role") || "").trim() as AccessTier;
    const role: AccessTier = roleParam || roleHeader || "public";

    const filtered = filterByRole(doc, role);

    return NextResponse.json({
      id: params.id,
      role,
      passport: filtered,
    });
  } catch (err) {
    console.error("get passport error:", err);
    return NextResponse.json(
      { error: "Failed to fetch passport" },
      { status: 500 }
    );
  }
}

