import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const client = new MongoClient(MONGODB_URI);

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id || id.length < 5) {
      return NextResponse.json(
        { error: "Invalid document ID" },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db("rareearthminerals");

    const doc = await db
      .collection("documents")
      .findOne({ _id: new ObjectId(id) });

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Convert Mongo record into clean public object
    const passport = doc.passport || {};
    const fpic = doc.fpic || {};

    return NextResponse.json({
      id: doc._id.toString(),
      filename: doc.filename,
      uploadedAt: doc.uploadedAt || null,
      textPreview: doc.textPreview || "",
      passport,
      fpic,
    });
  } catch (err: any) {
    console.error("Vault API error:", err);
    return NextResponse.json(
      { error: err.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

