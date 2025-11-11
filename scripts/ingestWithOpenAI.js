// scripts/ingestWithOpenAI.js
import fs from "fs";
import OpenAI from "openai";
import { MongoClient } from "mongodb";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const client = new MongoClient(process.env.MONGODB_URI);
const dbName = "rareearthminerals";

async function ingestPDF(filePath) {
  console.log(`📄 Uploading ${filePath} to OpenAI...`);

  // 1️⃣ Upload the raw PDF
  const upload = await openai.files.create({
    file: fs.createReadStream(filePath),
    purpose: "assistants",
  });

  console.log("🧠 Extracting structured text...");
  // 2️⃣ Extract clean, structured text
  const extraction = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Extract and structure the text from this EU Regulation PDF. " +
              "Preserve all article numbers, annex titles, and section headers. " +
              "Return a continuous text format suitable for vector embedding.",
          },
          { type: "input_file", file_id: upload.id },
        ],
      },
    ],
  });

  const text = extraction.output_text?.trim() || "";
  if (!text) throw new Error("No text returned from OpenAI.");

  console.log(`🪶 Extracted ${text.length.toLocaleString()} characters`);

  // 3️⃣ Chunk intelligently by regulation sections
  console.log("🔍 Splitting into sections...");
  const sections = text
    .split(/(?=Article\s+\d+|Annex\s+[IVXLC]+|Chapter\s+\d+)/i)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 100);

  console.log(`🧩 ${sections.length} sections detected`);

  // 4️⃣ Create embeddings + metadata per section
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection("documents");

  for (const section of sections) {
    console.log("🧬 Embedding section...");
    const emb = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: section.slice(0, 8000),
    });

    // 5️⃣ Semantic tagging: identify risk domain
    const tagsResp = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "From this section of EU regulation text, identify the key domain tags (e.g., 'Battery Passport', 'Supply Chain', 'Compliance', 'ESG', 'Reporting', 'Thermal Risk'). " +
                "Return a JSON array of 2–5 tags only.",
            },
            { type: "input_text", text: section.slice(0, 2000) },
          ],
        },
      ],
    });

    let tags = [];
    try {
      tags = JSON.parse(tagsResp.output_text);
    } catch {
      tags = ["General Regulation"];
    }

    // 6️⃣ Save section
    await collection.insertOne({
      text: section,
      embedding: emb.data[0].embedding,
      metadata: {
        source: filePath.split("/").pop(),
        sectionTitle: section.slice(0, 80),
        tags,
        type: "EU Regulation",
        date: new Date().toISOString(),
      },
    });
    console.log(`✅ Section stored with tags: ${tags.join(", ")}`);
  }

  console.log("🎯 Ingestion complete — all sections embedded and tagged");
  await client.close();
}

// --- CLI entrypoint ---
const filePath = process.argv[2];
if (!filePath) {
  console.error("❌ Usage: node scripts/ingestWithOpenAI.js ./public/filename.pdf");
  process.exit(1);
}

ingestPDF(filePath).catch((err) => {
  console.error("💥 Error during ingestion:", err);
  process.exit(1);
});

