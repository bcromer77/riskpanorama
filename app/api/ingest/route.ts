// app/api/ingest/route.ts
import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import OpenAI from "openai";
import pdfParse from "pdf-parse";
import crypto from "crypto";
import { hashPayload } from "@/lib/integrity";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MONGODB_URI = process.env.MONGODB_URI!;

// ---- Battery Passport Articles we map against ----
const BATTERY_ARTICLES = [
  { id: "Article 7", label: "Carbon Footprint Declaration" },
  { id: "Article 8", label: "Due Diligence Obligations" },
  { id: "Article 10", label: "Recycled Content" },
  { id: "Article 13", label: "QR Code + Digital Passport" },
];

// ---- FPIC Patterns ----
const FPIC_CUES = [
  "indigenous", "tribal", "land rights", "ancestral land",
  "community consent", "consultation", "UNDRIP", "FPIC",
  "indigenous peoples", "stakeholder engagement",
];

// --------------------------------------------------
// SAFEST JSON CLEANER ON EARTH
// --------------------------------------------------
function cleanJSON(output: string | null): string {
  if (!output) return "{}";
  return output
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/^\s+|\s+$/g, "")
    .trim();
}

// --------------------------------------------
// MAIN INGEST FUNCTION
// --------------------------------------------
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file to buffer and parse PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfText = await pdfParse(buffer);

    const text = pdfText.text.replace(/\s+/g, " ").trim().slice(0, 30000); // safety cap

    // ----------------------------------------------------------
    // Hash for Vault integrity (cryptographic ledger value)
    // ----------------------------------------------------------
    const vaultHash = hashPayload({
      filename: file.name,
      textSnippet: text.slice(0, 1000),
      timestamp: new Date().toISOString(),
    });

    // ----------------------------------------------------------
    // Also compute raw SHA-256 of text for PDF integrity
    // ----------------------------------------------------------
    const sha256 = crypto.createHash("sha256").update(text).digest("hex");

    // ----------------------------------------------------------
    // 1. GENERAL INSIGHT CLASSIFICATION
    // ----------------------------------------------------------
    const insightPrompt = `
You are analysing a PDF on sustainability, supply-chain, energy or materials science. 
Classify content into:
- Compliant (aligned with obligations)
- Needs Review (partially aligned or unclear)
- Gap (missing required elements)

Return EXACT JSON array:
[
  { "type": "Compliant", "text": "...", "sim": 0.xx },
  { "type": "Needs Review", "text": "...", "sim": 0.xx },
  { "type": "Gap", "text": "...", "sim": 0.xx }
]

Only give points that appear in the text.
Text:
"""${text}"""
    `;

    const insightsResp = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: insightPrompt,
    });

    const insights = JSON.parse(cleanJSON(insightsResp.output_text));

    // ----------------------------------------------------------
    // 2. BATTERY PASSPORT ARTICLE MAPPING
    // ----------------------------------------------------------
    const passportPrompt = `
Analyse the document against EU Battery Regulation Articles:
${BATTERY_ARTICLES.map((a) => `${a.id}: ${a.label}`).join("\n")}

Return EXACT JSON:
{
  "articles": [
    { "article": "Article 7", "status": "Compliant|Needs Review|Gap", "note": "..." },
    { "article": "Article 8", "status": "Compliant|Needs Review|Gap", "note": "..." },
    { "article": "Article 10", "status": "Compliant|Needs Review|Gap", "note": "..." },
    { "article": "Article 13", "status": "Compliant|Needs Review|Gap", "note": "..." }
  ]
}

Text:
"""${text}"""
    `;

    const passportResp = await openai.responses.create({
      model: "gpt-4.1",
      input: passportPrompt,
    });

    const passport = JSON.parse(cleanJSON(passportResp.output_text));

    // ----------------------------------------------------------
    // 3. FPIC / INDIGENOUS RIGHTS EXTRACTION
    // ----------------------------------------------------------
    const fpicPrompt = `
Extract FPIC (Free, Prior and Informed Consent) and Indigenous Rights signals.

Look for:
${FPIC_CUES.join(", ")}

Return EXACT JSON:
{
  "items": [
    { "category": "FPIC", "text": "...", "sim": 0.xx },
    { "category": "Rights", "text": "...", "sim": 0.xx }
  ]
}

Only return items if the text actually mentions them.

Text:
"""${text}"""
    `;

    const fpicResp = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: fpicPrompt,
    });

    const fpic = JSON.parse(cleanJSON(fpicResp.output_text));

    // ----------------------------------------------------------
    // 4. WRITE TO MONGODB (Vault)
    // ----------------------------------------------------------
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db("rareearthminerals");

    const now = new Date();

    const doc = {
      filename: file.name,
      uploadedAt: now,
      textPreview: text.slice(0, 500),
      insights,
      passport,
      fpic,
      hash: vaultHash,     // ★ main integrity field
      sha256,               // optional secondary proof
    };

    const result = await db.collection("documents").insertOne(doc);
    await client.close();

    const id = result.insertedId.toString();

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://www.rareearthminerals.ai";
    const passportUrl = `${baseUrl.replace(/\/$/, "")}/passport/${id}`;

    // ----------------------------------------------------------
    // 5. RETURN TO FRONTEND
    // ----------------------------------------------------------
    return NextResponse.json({
      message: "📎 Document stored in Vault",
      id,
      preview: text.slice(0, 200),
      hash: vaultHash,
      passportUrl,
      uploadedAt: now.toISOString(),
      passport,
      fpic,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

