import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

export const runtime = "nodejs";
const MONGODB_URI = process.env.MONGODB_URI!;
const client = new MongoClient(MONGODB_URI);

export async function POST(req: NextRequest) {
  let mongoConnected = false;
  try {
    const { docId, q, topK = 4 } = await req.json();
    if (!docId || !q) {
      return NextResponse.json({ success: false, error: "Missing docId or q" }, { status: 400 });
    }

    await client.connect();
    mongoConnected = true;
    const db = client.db("veracity101");
    const chunks = db.collection("talk_chunks");

    // Try MongoDB text search first
    let results = [];
    try {
      results = await chunks
        .find(
          { docId: new ObjectId(docId), $text: { $search: q } },
          { projection: { score: { $meta: "textScore" }, text: 1, idx: 1 } }
        )
        .sort({ score: { $meta: "textScore" } })
        .limit(topK)
        .toArray();
    } catch {
      // fallback to regex if text index missing
      results = await chunks
        .find({ docId: new ObjectId(docId), text: { $regex: q, $options: "i" } }, { projection: { text: 1, idx: 1 } })
        .limit(topK)
        .toArray();
    }

    if (!results.length) {
      return NextResponse.json({
        success: true,
        answer: "I couldn’t find any relevant text for that query.",
        contexts: [],
      });
    }

    const contexts = results.map((r: any) => ({
      idx: r.idx,
      snippet: String(r.text || "").slice(0, 600),
    }));

    const answer =
      `Based on the document, here are the most relevant excerpts:\n\n` +
      contexts
        .map((c) => `• [Chunk ${c.idx}] ${c.snippet.replace(/\s+/g, " ").trim()}`)
        .join("\n\n");

    return NextResponse.json({ success: true, answer, contexts });
  } catch (err: any) {
    console.error("query error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    if (mongoConnected) await client.close();
  }
}

