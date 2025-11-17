import { MongoClient } from "mongodb";
import OpenAI from "openai";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = new MongoClient(process.env.MONGODB_URI);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const sampleSignals = [
  {
    title: "Mozambique graphite exports delayed by environmental audit",
    summary:
      "Graphite shipments from Balama port halted pending ESG audit. Disrupts anode-grade material supply to EU OEMs under Battery Passport compliance rules.",
    source: "Reuters",
    date: "2025-10-10",
    region: "Mozambique",
  },
  {
    title: "China cuts rare-earth export quota by 15%",
    summary:
      "China’s Ministry of Commerce announced a quota reduction impacting NdPr oxide supply. EU and U.S. magnet producers facing price pressure.",
    source: "SCMP",
    date: "2025-10-12",
    region: "China",
  },
  {
    title: "EU enforces ESG screening on graphite imports",
    summary:
      "New directive mandates full supply chain traceability for natural graphite sourcing under Article 8 of the EU Battery Regulation.",
    source: "Politico",
    date: "2025-11-05",
    region: "EU",
  },
  {
    title: "Chile lithium nationalization triggers new contract audits",
    summary:
      "Chile’s Senate approval of lithium nationalization has led to a new ESG and indigenous rights compliance phase for global miners.",
    source: "Financial Times",
    date: "2025-10-22",
    region: "Chile",
  },
  {
    title: "Canada introduces Critical Minerals ESG Disclosure Act",
    summary:
      "The act enforces mandatory ESG and community consultation disclosures for graphite, lithium, and cobalt projects from 2025 onward.",
    source: "Bloomberg",
    date: "2025-09-15",
    region: "Canada",
  },
];

const run = async () => {
  await client.connect();
  const db = client.db("rareearthminerals");
  const col = db.collection("signals");

  for (const sig of sampleSignals) {
    const text = `${sig.title}. ${sig.summary}`;
    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    await col.insertOne({
      ...sig,
      embedding: emb.data[0].embedding,
    });
    console.log("✅ Inserted:", sig.title);
  }

  await client.close();
  console.log("🎉 Seeding complete.");
};

run().catch(console.error);

