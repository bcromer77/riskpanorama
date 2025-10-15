import { MongoClient } from "mongodb";

export async function POST(req) {
  const { email } = await req.json();
  if (!email) return new Response("Missing email", { status: 400 });

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "riskpanorama");
  await db.collection("signups").insertOne({ email, createdAt: new Date() });
  await client.close();

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}

