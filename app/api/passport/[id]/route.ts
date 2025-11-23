// app/api/passport/[id]/route.ts
// Neutral Passport Evidence API (Final, Safe)
// - No compliance claims
// - No ESG interpretation
// - Deterministic evidence states only:
//   verified | missing | checking
// - FPIC returned as neutral “extraContext” (text only)

import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { Badge } from "@/components/ui/badge";

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = "rareearthminerals";

export const dynamic = "force-dynamic"; // ensure fresh fetches

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    // ★ Required by Next.js (even if sync today)
    const { id } = await context.params;

    // DB client
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    const doc = await db
      .collection("documents")
      .findOne({ _id: new ObjectId(id) });

    await client.close();

    if (!doc) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // ★ Neutral forward-only status mapping
    function normalizeStatus(s: string | undefined) {
      if (!s) return "checking";
      const v = s.toLowerCase();
      if (v.includes("verified")) return "verified";
      if (v.includes("missing")) return "missing";
      return "checking";
    }

    // Safe, deterministic article statuses
    const evidence =
      doc.passport?.articles?.map((a: any) => ({
        article: a.article,
        status: normalizeStatus(a.status),
        note: a.note,
      })) || [];

    // ★ FPIC → neutral textual “Extra Context”
    const extraContext =
      doc.fpic?.items?.map((x: any) => ({
        text: x.text,
      })) || [];

    // ★ Neutral, regulator-safe record (never “passport”)
    const record = {
      record_id: id,
      filename: doc.filename,
      uploadedAt: doc.uploadedAt,
      textPreview: doc.textPreview,
      signatureVerified: doc.signatureVerified || false,
      vaultEventId: doc.vaultEventId || null,
      evidence,
      extraContext,
    };

    // ★ NO CACHING: Every fetch must represent the current evidence state
    return new NextResponse(JSON.stringify(record), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  } catch (err: any) {
    console.error("Passport API error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

