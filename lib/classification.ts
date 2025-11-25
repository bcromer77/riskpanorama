// lib/classification.ts
import OpenAI from "openai";
import pdfParse from "pdf-parse";

// Initialize OpenAI client (make sure API key is in environment)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Max text length to pass to the LLM (for cost/token safety)
const MAX_TEXT_LENGTH = 30000;

// ---- 1. CONSOLIDATED BATTERY PASSPORT ARTICLES (EPIC 2.2 Scope) ----
export const BATTERY_ARTICLES = [
    { id: "Article 7", label: "Carbon Footprint Declaration" },
    { id: "Article 8", label: "Due Diligence Obligations (Ethics/Labor)" },
    { id: "Article 10", label: "Recycled Content" },
    { id: "Article 12", label: "Performance and Durability" }, // NEW MANDATORY ARTICLE
    { id: "Article 13", label: "QR Code + Digital Passport" },
    { id: "Article 39", label: "Material Composition and Critical Raw Materials" }, // NEW MANDATORY ARTICLE
];

// ---- 2. FPIC Patterns (for ethical classification) ----
const FPIC_CUES = [
    "indigenous", "tribal", "land rights", "ancestral land",
    "community consent", "consultation", "UNDRIP", "FPIC",
    "indigenous peoples", "stakeholder engagement", "water rights",
];

// --------------------------------------------------
// SAFEST JSON CLEANER (Ensures LLM output is parsable)
// --------------------------------------------------
function cleanJSON(output: string | null): string {
    if (!output) return "{}";
    return output
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
}

/**
 * Main function to extract, classify, and structure data from a PDF buffer.
 */
export async function processDocument(buffer: Buffer, filename: string) {
    
    // 1. Extract and Clean Text
    const pdfText = await pdfParse(buffer);
    const text = pdfText.text.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_LENGTH);

    // --- 2. CLASSIFICATION STAGE 1: BATTERY PASSPORT ARTICLE MAPPING (High-Value) ---
    const passportPrompt = `
You are a regulatory compliance engine for the EU Battery Regulation.
Analyse the document titled "${filename}" against the following mandatory Articles:
${BATTERY_ARTICLES.map((a) => `${a.id}: ${a.label}`).join("\n")}

For each article, determine the evidence status and provide a brief, objective note based ONLY on the provided text.

Evidence Status definitions:
- Compliant (aligned with obligations / evidence present)
- Needs Review (partially aligned or unclear/inconsistent evidence)
- Gap (missing required elements / no evidence found)

Return EXACT JSON:
{
  "articles": [
    { "article": "Article 7", "status": "Compliant|Needs Review|Gap", "note": "..." },
    { "article": "Article 8", "status": "Compliant|Needs Review|Gap", "note": "..." },
    // ... all 6 articles continue here ...
  ]
}

Text:
"""${text}"""
    `;

    const passportResp = await openai.responses.create({
        model: "gpt-4-turbo", // Use a high-capability model for complex regulation
        input: passportPrompt,
    });
    const passport = JSON.parse(cleanJSON(passportResp.output_text));


    // --- 3. CLASSIFICATION STAGE 2: FPIC / INDIGENOUS RIGHTS EXTRACTION (Ethical Context) ---
    // Note: This classification is purely for "Extra Context," meeting the Lawyer's desire to separate raw context from compliance status.
    const fpicPrompt = `
Extract all signals related to FPIC (Free, Prior and Informed Consent), Indigenous Rights, and water usage rights.

Look for keywords:
${FPIC_CUES.join(", ")}

Return EXACT JSON:
{
  "items": [
    { "category": "FPIC", "text": "...", "snippet": "..." },
    // ... continue for all instances found ...
  ]
}

Only return items if the text actually mentions them.

Text:
"""${text}"""
    `;

    const fpicResp = await openai.responses.create({
        model: "gpt-4.1-mini", // Can use a cheaper model for simple extraction
        input: fpicPrompt,
    });
    const fpic = JSON.parse(cleanJSON(fpicResp.output_text));
    
    // --- 4. RETURN STRUCTURED RESULT ---
    return {
        text: text,
        textPreview: text.slice(0, 500),
        passport: passport,
        fpic: fpic,
        // The VaultHash and SHA256 will be calculated on the raw buffer 
        // in the main ingest route to ensure cryptographic integrity.
    };
}
