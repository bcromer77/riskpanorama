import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY!;
const client = new MongoClient(MONGODB_URI);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, researcher = "galina-kennedy" } = body;

    if (!question)
      return NextResponse.json({ error: "No question provided" }, { status: 400 });

    // 1️⃣ Generate embedding for the question
    const embedRes = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        input: question,
        model: "voyage-large-2",
      }),
    });

    const embedData = await embedRes.json();
    const queryVector = embedData.data[0].embedding;

    // 2️⃣ Connect to Mongo
    await client.connect();
    const db = client.db("veracity101");
    const col = db.collection("talk_chunks");

    // 3️⃣ Run vector search scoped to researcher
    const results = await col
      .aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector,
            numCandidates: 100,
            limit: 5,
            filter: { researcher },
          },
        },
        {
          $project: {
            text: 1,
            fileName: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ])
      .toArray();

    if (!results.length) {
      return NextResponse.json({
        answer: "No relevant context found in uploaded documents.",
      });
    }

    // 4️⃣ Build context for summarization
    const context = results.map(r => r.text).join("\n\n");

    // 5️⃣ Ask Voyage to summarise answer
    const completion = await fetch("https://api.voyageai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "voyage-chat-1",
        messages: [
          {
            role: "system",
            content:
              "You are an expert assistant summarising Galina Kennedy’s technical research in plain language.",
          },
          {
            role: "user",
            content: `Context:\n${context}\n\nQuestion: ${question}\nAnswer clearly and concisely.`,
          },
        ],
        max_tokens: 500,
      }),
    });

    const completionData = await completion.json();
    const answer = completionData?.choices?.[0]?.message?.content || "No answer generated.";

    return NextResponse.json({
      answer,
      sources: results.map(r => ({
        file: r.fileName,
        score: r.score,
      })),
    });
  } catch (err: any) {
    console.error("❌ Query error:", err);
    return NextResponse.json(
      { error: "Failed to query database", details: err.message },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

