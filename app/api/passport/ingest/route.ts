// app/api/passport/ingest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const client = new MongoClient(process.env.MONGODB_URI!);

export const runtime = "nodejs"; // ensures server context, not edge

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());

    // --- Step 1: summarize via text model (no multimodal weirdness) ---
    const textSummary = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Summarise this supplier document for a Battery Passport. Include material, origin, ESG or compliance points.",
        },
        {
          role: "user",
          content: `Filename: ${file.name}\n\nRaw text bytes (base64 length ${buf.length}). Summarise.`,
        },
      ],
    });

    const summary =
      textSummary.choices[0]?.message?.content ??
      "No summary generated.";

    // --- Step 2: embed summary ---
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: summary,
    });

    // --- Step 3: store in Mongo ---
    await client.connect();
    const db = client.db("rareearthminerals");
    const col = db.collection("battery_passports");

    const doc = {
      supplier: file.name.split("_")[0] || "Unknown",
      filename: file.name,
      summary,
      embedding: embedding.data[0].embedding,
      createdAt: new Date(),
    };

    const result = await col.insertOne(doc);

    return NextResponse.json({
      message: "✅ Passport created",
      id: result.insertedId.toString(),
      preview: summary.slice(0, 180) + "...",
    });
  } catch (err: any) {
    console.error("❌ ingest error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    try {
      await client.close();
    } catch {}
  }
}

