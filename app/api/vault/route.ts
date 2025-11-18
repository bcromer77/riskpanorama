import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import crypto from "crypto";

const MONGODB_URI = process.env.MONGODB_URI!;
const client = new MongoClient(MONGODB_URI);

/**
 * RareEarthMinerals.ai
 * FPIC + Battery Passport Vault
 *
 * Each vault entry is:
 *  - cryptographically hashed (sha256)
 *  - immutable
 *  - chain-linked
 *  - ready for QR code
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      supplier,
      sku,
      notes,
      passport,
      fpic,
      insights,
      rawText
    } = body;

    if (!rawText) {
      return NextResponse.json(
        { error: "Missing rawText — the vault must store a source hash." },
        { status: 400 }
      );
    }

    // --- 1. Create SHA-256 hash of document text ---
    const contentHash = crypto
      .createHash("sha256")
      .update(rawText)
      .digest("hex");

    await client.connect();
    const db = client.db("rareearthminerals");

    // --- 2. Find last entry to chain hashes ---
    const last = await db
      .collection("vault")
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    const lastHash = last[0]?.vaultHash || null;

    // --- 3. Combine into a vault block ---
    const block = {
      createdAt: new Date(),
      supplier: supplier || null,
      sku: sku || null,
      operatorNotes: notes || null,
      passport: passport || null,
      fpic: fpic || null,
      insights: insights || null,
      contentHash,
      previous: lastHash,
    };

    // --- 4. Create immutable vault hash ---
    const vaultHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(block))
      .digest("hex");

    const vaultRecord = {
      ...block,
      vaultHash,
    };

    // --- 5. Write to database ---
    const result = await db.collection("vault").insertOne(vaultRecord);

    // --- 6. Response includes Vault ID & QR link base ---
    return NextResponse.json({
      message: "Vault entry sealed",
      vaultId: result.insertedId,
      vaultHash,
      previousHash: lastHash,
      viewURL: `/vault/${result.insertedId}`,
    });
  } catch (err: any) {
    console.error("VAULT ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Vault API ready",
    docs: {
      POST: "/api/vault (create sealed FPIC + passport vault entry)",
    },
  });
}

