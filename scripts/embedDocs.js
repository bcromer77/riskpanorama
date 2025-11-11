// scripts/embedDocs.js
const { MongoClient } = require("mongodb");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const uri = "mongodb+srv://bazilcromer_db_user:riskpanor12345@cluster0.vpwmsh.mongodb.net/";
const client = new MongoClient(uri);
const VOYAGE_API_KEY = "pa-KPmH-Duazy4mwfaGzUj2_TMnAX6QhnUGYechmigvHFL";

async function run() {
  try {
    await client.connect();
    const db = client.db("rareearthminerals");
    const docs = db.collection("documents");

    const allDocs = await docs.find({ embedding: { $exists: false } }).toArray();
    if (allDocs.length === 0) {
      console.log("✅ No unembedded documents found — all up to date!");
      return;
    }

    for (const doc of allDocs) {
      const resp = await fetch("https://api.voyageai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VOYAGE_API_KEY}`
        },
        body: JSON.stringify({
          model: "voyage-large-2",
          input: doc.text.slice(0, 8000)
        })
      });

      const data = await resp.json();
      const embedding = data.data?.[0]?.embedding;

      if (embedding) {
        await docs.updateOne({ _id: doc._id }, { $set: { embedding } });
        console.log("✅ Embedded:", doc.metadata?.country || "Unknown");
      } else {
        console.log("⚠️ No embedding returned for:", doc.metadata?.country || "Unknown");
      }
    }

    console.log("🎉 All unembedded documents processed!");
  } catch (err) {
    console.error("❌ Error embedding docs:", err);
  } finally {
    await client.close();
  }
}

run();

