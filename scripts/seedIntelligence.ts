import { MongoClient } from "mongodb";
import OpenAI from "openai";

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const docs = [
  {
    title: "EU Battery Regulation Article 8",
    text: "Mandates due diligence for lithium, nickel, and cobalt supply chains across the EU starting in 2025.",
    region: "EU",
    category: "Regulation",
  },
  {
    title: "Mexico Lithium Nationalization",
    text: "Mexico has nationalized its lithium reserves, impacting supply routes to U.S. and EU battery manufacturers.",
    region: "Mexico",
    category: "Policy",
  },
  {
    title: "China Rare Earth Export Controls",
    text: "China introduces new export restrictions on graphite and rare earths in 2024.",
    region: "China",
    category: "Trade",
  },
];

async function run() {
  await client.connect();
  const db = client.db("rareearthminerals");
  const coll = db.collection("intelligence_docs");

  for (const doc of docs) {
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: doc.text,
    });

    await coll.insertOne({
      ...doc,
      embedding: embedding.data[0].embedding,
    });
    console.log(`Inserted: ${doc.title}`);
  }

  console.log("✅ Seed complete!");
  await client.close();
}

run().catch(console.error);

