import "dotenv/config";
import { getMongoClient } from "../lib/mongo";
import { embedText } from "../lib/vector";

const scenarios = [
  {
    title: "Chile Brine Extraction Tightening",
    country: "Chile",
    mineral: "Lithium",
    narrative:
      "Chile increases brine extraction taxes by 10%, tightening lithium supply and raising LFP battery costs.",
  },
  {
    title: "Indonesia Nickel Tariff Pressure",
    country: "Indonesia",
    mineral: "Nickel",
    narrative:
      "Nickel export tariffs up 15%, impacting stainless steel and EV battery producers dependent on Indonesian supply.",
  },
  {
    title: "DRC Cobalt Transport Disruptions",
    country: "DR Congo",
    mineral: "Cobalt",
    narrative:
      "Cobalt shipments delayed due to rail bottlenecks; European OEMs face 30-day inventory gaps.",
  },
  {
    title: "Nevada Tribal Lithium Dispute",
    country: "USA",
    mineral: "Lithium",
    narrative:
      "Tribal opposition to Nevada Thacker Pass halts new exploration permits pending environmental hearings.",
  },
  {
    title: "Mozambique Graphite Force Majeure & Sodium Expansion",
    country: "Mozambique",
    mineral: "Graphite / Sodium",
    narrative:
      "Balama mine declares force majeure amid port congestion; new sodium battery pilot facilities face logistics delays.",
  },
];

async function seed() {
  const db = await getMongoClient();
  const col = db.collection("esg_signals");

  for (const s of scenarios) {
    console.log(`Embedding ${s.title}...`);
    const embedding = await embedText(s.narrative);
    await col.insertOne({
      ...s,
      embedding,
      publishedAt: new Date(),
    });
  }

  console.log("✅ Seeding complete with real Voyage embeddings");
  process.exit(0);
}

seed();

