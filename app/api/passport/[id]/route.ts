kimport { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = "rareearthminerals";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    const doc = await db
      .collection("documents")
      .findOne({ _id: new ObjectId(id) });

    client.close();

    if (!doc) {
      return NextResponse.json(
        { error: "Passport not found" },
        { status: 404 }
      );
    }

    // 🔒 `role=public` strips internal notes
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || "public";

    const publicPassport = {
      passport_id: id,
      filename: doc.filename,
      uploadedAt: doc.uploadedAt,
      preview: doc.textPreview,
      passport: doc.passport || {},
      insights:
        role === "public"
          ? undefined // hide operator insights publicly
          : doc.insights || [],
      fpic:
        role === "public"
          ? doc.fpic || {} // FPIC is allowed publicly
          : doc.fpic || {},
    };

    return NextResponse.json(publicPassport);
  } catch (err: any) {
    console.error("Passport API error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

