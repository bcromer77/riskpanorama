// scripts/insertDocs.js
const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://bazilcromer_db_user:riskpanor12345@cluster0.vpwmsh.mongodb.net/";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("rareearthminerals");
    const docs = db.collection("documents");

    await docs.insertMany([
      {
        text: "Mozambique has delayed export permits for graphite shipments through the Nacala port due to environmental audits. This affects battery-grade graphite supply to U.S. and EU manufacturers reliant on Balama operations.",
        metadata: { country: "Mozambique", law: "Export Permit Regulation" }
      },
      {
        text: "Mexico is considering tightening lithium export controls under its 2024 mining reforms, potentially impacting automakers dependent on Sonora lithium projects.",
        metadata: { country: "Mexico", law: "Mining Reform 2024" }
      },
      {
        text: "Canada introduced stricter due diligence standards for critical mineral supply chains under the 2025 ESG Reporting Act, affecting graphite and cobalt importers.",
        metadata: { country: "Canada", law: "ESG Reporting Act 2025" }
      }
    ]);

    console.log("✅ Added new filings successfully.");
  } catch (err) {
    console.error("❌ Error inserting documents:", err);
  } finally {
    await client.close();
  }
}

run();

