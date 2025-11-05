import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const client = new MongoClient(MONGODB_URI);

export async function GET(req: NextRequest) {
  try {
    const researcher = req.nextUrl.searchParams.get("researcher") || "galina-kennedy";

    await client.connect();
    const db = client.db("veracity101");
    const chunks = await db
      .collection("talk_chunks")
      .find({ fileName: { $exists: true } })
      .toArray();

    // 🧠 Group by fileName
    const grouped = Object.values(
      chunks.reduce((acc: any, c: any) => {
        if (!acc[c.fileName]) {
          acc[c.fileName] = { title: c.fileName, text: "" };
        }
        acc[c.fileName].text += " " + c.text;
        return acc;
      }, {})
    );

    // ✂️ Extract preview text
    const docs = grouped.map((g: any) => ({
      title: g.title,
      summary: g.text.slice(0, 500),
    }));

    return NextResponse.json({ docs });
  } catch (err: any) {
    console.error("GET /api/docs error:", err);
    return NextResponse.json({ error: "Failed to fetch docs" }, { status: 500 });
  } finally {
    await client.close();
  }
}

