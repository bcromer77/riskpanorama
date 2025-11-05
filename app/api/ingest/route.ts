// app/api/ingest/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { MongoClient, Db } from "mongodb";

export const runtime = "nodejs";

// ---------------- Env / Config ----------------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = process.env.DB_PANORAMA || "riskpanorama";
const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25 MB
const MIN_TEXT_CHARS = 100;

// ---------------- OpenAI ----------------
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// ---------------- Mongo (cached) ----------------
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
async function getDb(): Promise<Db> {
  if (!MONGODB_URI) throw new Error("Missing MONGODB_URI");
  if (cachedDb) return cachedDb;
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI, { maxPoolSize: 10 });
    await cachedClient.connect();
  }
  cachedDb = cachedClient.db(DB_NAME);
  return cachedDb;
}

// ---------------- pdf-parse resolver ----------------
// We pinned pdf-parse@1.1.1, which exposes a default export in most builds.
// This resolver supports named/default/namespace callable cases defensively.
import * as pdfParseNS from "pdf-parse";
type PdfParseFn = (buf: Buffer) => Promise<{ text: string }>;
function resolvePdfParse(ns: any): PdfParseFn | undefined {
  if (typeof ns?.pdfParse === "function") return ns.pdfParse as PdfParseFn; // ESM named
  if (typeof ns?.default === "function") return ns.default as PdfParseFn;   // CJS default
  if (typeof ns === "function") return ns as PdfParseFn;                   // callable ns
  return undefined;
}
const pdfParseFn = resolvePdfParse(pdfParseNS);

// ---------------- pdfjs-dist fallback ----------------
import { getDocument } from "@mozilla/pdfjs-dist/legacy/build/pdf.mjs";
// No workerSrc needed in this server context

async function extractWithPdfJs(buffer: Buffer): Promise<string> {
  const loadingTask = getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  let out = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Concatenate text items
    const text = (content.items as any[]).map((it) => (it?.str as string) || "").join(" ");
    if (text.trim()) {
      out += (out ? "\n\n" : "") + text.trim();
    }
  }
  return out.trim();
}

// ---------------- 1) Local text extraction ----------------
async function extractTextFromPDF(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  // Basic validation (return 4xx upstream)
  if (buffer.length === 0) {
    throw new Error("PDF is empty (0 bytes)");
  }
  if (buffer.length > MAX_PDF_BYTES) {
    throw new Error(`PDF too large (> ${MAX_PDF_BYTES / (1024 * 1024)} MB)`);
  }
  const magic = buffer.slice(0, 5).toString();
  if (magic !== "%PDF-") {
    throw new Error("File is not a valid PDF");
  }

  // Try pdf-parse first if available
  let text = "";
  if (pdfParseFn) {
    try {
      const parsed = await pdfParseFn(buffer);
      text = (parsed?.text || "").trim();
      if (text.length >= MIN_TEXT_CHARS) {
        console.log(`✅ pdf-parse extracted ${text.length} chars`);
        return text;
      }
      console.warn("pdf-parse returned too little text; trying pdfjs...");
    } catch (e) {
      console.warn("pdf-parse failed; trying pdfjs...", e);
    }
  } else {
    console.warn("pdf-parse function not resolved; trying pdfjs...");
  }

  // Fallback: pdfjs-dist
  try {
    text = await extractWithPdfJs(buffer);
    if (text.length >= MIN_TEXT_CHARS) {
      console.log(`✅ pdfjs extracted ${text.length} chars`);
      return text;
    }
  } catch (e) {
    console.warn("pdfjs fallback failed", e);
  }

  throw new Error("No readable text found (likely scanned or protected PDF)");
}

// ---------------- 2) Summarize (OpenAI) ----------------
async function summarizeForAudiences(text: string) {
  const audiences = ["Lay", "Technical", "Policy", "Commercial"] as const;
  const summaries: Record<string, string> = {};

  for (const audience of audiences) {
    const prompt = `Summarize the following content for a ${audience.toLowerCase()} audience.
Focus on relevance to NIS2, energy transition, climate action, grid resilience, or compliance in Ireland.
Write clear plain sentences (no markdown, no bullets). Be concise but accurate.

Text:
${text.slice(0, 7000)}
`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 700,
    });

    summaries[audience] =
      res.choices?.[0]?.message?.content?.trim() ?? "No summary generated.";
  }
  return summaries;
}

// ---------------- 3) Embed and store ----------------
async function embedAndSave(
  fileName: string,
  text: string,
  summaries: Record<string, string>,
  researcher: string
) {
  const db = await getDb();
  const col = db.collection("research_docs");

  const emb = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: text.slice(0, 8000),
  });

  await col.updateOne(
    { title: fileName, researcher: researcher || "unknown" },
    {
      $set: {
        title: fileName,
        researcher: researcher || "unknown",
        text,
        summaries,
        embedding: emb.data[0].embedding,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );
}

// ---------------- 4) Route ----------------
export async function POST(req: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    if (!MONGODB_URI) {
      return NextResponse.json({ error: "Missing MONGODB_URI" }, { status: 500 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const researcher = (form.get("researcher") as string) || "unknown";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (
      file.type &&
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    const text = await extractTextFromPDF(file);
    const summaries = await summarizeForAudiences(text);
    await embedAndSave(file.name, text, summaries, researcher);

    return NextResponse.json({
      success: true,
      message: "PDF processed and stored",
      fileName: file.name,
      charCount: text.length,
      researcher,
      summaries,
      parser: pdfParseFn ? "pdf-parse or pdfjs fallback" : "pdfjs",
    });
  } catch (err: any) {
    const msg = err?.message || "Processing error";
    // Map expected issues to 4xx so UI can show helpful messages
    if (
      msg.includes("not a valid PDF") ||
      msg.includes("empty (0 bytes)") ||
      msg.includes("too large") ||
      msg.includes("No readable text")
    ) {
      return NextResponse.json({ error: msg }, { status: 422 });
    }
    console.error("❌ Ingest pipeline failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
