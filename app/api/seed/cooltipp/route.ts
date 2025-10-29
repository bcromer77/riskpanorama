import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import fs from "fs";
import path from "path";

export const runtime = 'nodejs';

export async function GET() {
  try {
    // connect to Mongo
    const client = await clientPromise;

    // we’ll write CoolTipp data into the veracity101 database
    const db = client.db("veracity101");

    // read all JSON files from seed/cooltipp
    const basePath = path.join(process.cwd(), "seed/cooltipp");
    const files = fs.readdirSync(basePath);

    const results: Record<string, any> = {};

    for (const file of files) {
      if (!file.endsWith(".json")) continue;

      // e.g. county_assets.json -> county_assets
      const collectionName = file.replace(".json", "");

      const raw = fs.readFileSync(path.join(basePath, file), "utf8");
      const data = JSON.parse(raw);

      // normalize: if the file is a single object, wrap it
      const docs = Array.isArray(data) ? data : [data];

      // insert into Mongo
      const insertResult = await db.collection(collectionName).insertMany(docs);

      results[collectionName] = {
        insertedCount: insertResult.insertedCount,
      };
    }

    return NextResponse.json({
      success: true,
      seeded_collections: results,
      message: "CoolTipp seed data loaded ✅"
    });
  } catch (err: any) {
    console.error("❌ Seed error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

