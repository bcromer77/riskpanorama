import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = "rareearthminerals";

let clientPromise: Promise<MongoClient> | null = null;

function getClient() {
  if (!clientPromise) {
    clientPromise = new MongoClient(MONGODB_URI).connect();
  }
  return clientPromise;
}

export async function GET() {
  try {
    const client = await getClient();
    const db = client.db(DB_NAME);

    const docs = await db
      .collection("documents")
      .find(
        {},
        {
          projection: {
            filename: 1,
            uploadedAt: 1,
            textPreview: 1,
            passport: 1,
            fpic: 1,
          },
        }
      )
      .sort({ uploadedAt: -1 })
      .limit(50)
      .toArray();

    const mapped = docs.map((d: any) => ({
      id: d._id.toString(),
      filename: d.filename ?? "Untitled document",
      uploadedAt: d.uploadedAt ?? null,
      textPreview: d.textPreview ?? "",
      passport: d.passport ?? null,
      fpic: d.fpic ?? null,
    }));

    return NextResponse.json({ documents: mapped });
  } catch (err: any) {
    console.error("Error in /api/document:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to load documents" },
      { status: 500 }
    );
  }
}

