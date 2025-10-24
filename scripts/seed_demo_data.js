import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
const dbName = "riskpanorama";

async function seed() {
  await client.connect();
  const db = client.db(dbName);

  const risks = db.collection("risks");

  await risks.deleteMany({});
  await risks.insertMany([
    {
      supplier: "BatteryPlus Ltd",
      sku: "SKU-4782",
      risk_score: 0.9,
      status: "missing_passport",
      recommendations: ["Request CE/Battery passport from supplier."],
      timestamp: new Date(),
    },
    {
      supplier: "GreenVolt Energy",
      sku: "SKU-5001",
      risk_score: 0.25,
      status: "compliant",
      recommendations: ["Maintain certificate archive"],
      timestamp: new Date(),
    },
  ]);

  console.log("✅ Seeded demo data");
  await client.close();
}

seed().catch(console.error);

