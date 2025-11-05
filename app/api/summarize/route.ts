// app/api/summarize/route.ts
import "dotenv/config";
import { NextRequest, NextResponse } from "next/server";
import { MongoClient, Db } from "mongodb";

export const runtime = "nodejs";

// --- Environment variables
const MONGODB_URI = process.env.MONGODB_URI!;
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY!;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "veracity101";
const MONGO_COLLECTION = process.env.MONGO_COLLECTION_SUMMARIES || "summaries";

if (!MONGODB_URI) {
  console.error("❌ Missing MONGODB_URI in environment");
}
if (!VOYAGE_API_KEY) {
  console.error("❌ Missing VOYAGE_API_KEY in environment");
}

// --- Connection cache
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function getDb(): Promise<Db> {
  if (cachedDb) return cachedDb;
  cachedClient ??= new MongoClient(MONGODB_URI, { maxPoolSize: 10 });
  await cachedClient.connect();
  cachedDb = cachedClient.db(MONGO_DB_NAME);
  return cachedDb;
}

// --- Voyage summarizer
async function voyageSummarize(prompt: string): Promise<string> {
  const res = await fetch("https://api.voyageai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "voyage-large-2",
      messages: [
        { role: "system", content: "You are an expert science communicator." },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Voyage ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return (
    data?.choices?.[0]?.message?.content?.trim() ||
    data?.output_text?.trim() ||
    data?.data?.[0]?.text?.trim() ||
    "No summary returned."
  );
}

// --- Main POST handler
export async function POST(req: NextRequest) {
  try {
    const { title, text, researcher } = await req.json();

    if (!title || !text) {
      return NextResponse.json({ error: "Missing text or title" }, { status: 400 });
    }

    const safeText = String(text).slice(0, 3500);
    const audiences = ["Lay", "Technical", "Policy", "Commercial"] as const;

    const summaries: Record<(typeof audiences)[number], string> = {
      Lay: "",
      Technical: "",
      Policy: "",
      Commercial: "",
    };

    // Generate summaries for each audience
    for (const audience of audiences) {
      const prompt = `Summarize the following research for a ${audience.toLowerCase()} audience.

Be concise but accurate. Focus on:
- Key findings or innovations
- Real-world use (especially energy, batteries, NIS2, or Irish rural applications)
- Why this matters to the ${audience.toLowerCase()} audience.

Return clear sentences without markdown or bullets.

Text:
${safeText}`;

      try {
        summaries[audience] = await voyageSummarize(prompt);
        console.log(`✅ Voyage summary generated for ${audience}`);
      } catch (e: any) {
        console.error(`Voyage generation failed for ${audience}:`, e?.message || e);
        summaries[audience] = `⚠️ Voyage error: ${e?.message || "failed"}`;
      }
    }

    // Store in Mongo
    const db = await getDb();
    await db.collection(MONGO_COLLECTION).updateOne(
      { researcher: researcher || "unknown", title },
      {
        $set: { summaries, researcher: researcher || "unknown", updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    return NextResponse.json({ summaries });
  } catch (err: any) {
    console.error("❌ Summarize route error:", err);
    return NextResponse.json(
      { error: "Failed to generate summaries", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

