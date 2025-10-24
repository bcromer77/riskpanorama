import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { MongoClient } from "mongodb";
import PDFParser from "pdf2json";

const MONGODB_URI = process.env.MONGODB_URI!;
const client = new MongoClient(MONGODB_URI);

export const runtime = "nodejs";

// --- safe decode helper: handles malformed and partially-encoded text ---
function safeDecodeURIComponent(input: string): string {
  if (!input) return "";
  try {
    return decodeURIComponent(input);
  } catch {
    // Some pdf2json outputs have stray '%' not forming valid encodings.
    // Best-effort: replace lone '%' with '%25' and try again.
    try {
      const repaired = input.replace(/%(?![0-9A-Fa-f]{2})/g, "%25");
      return decodeURIComponent(repaired);
    } catch {
      // Final fallback: return raw
      return input;
    }
  }
}

// --- extract text from PDF file ---
async function extractTextFromPDF(pdfPath: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const pdfParser = new PDFParser();
    pdfParser.on("pdfParser_dataError", (errData) => reject(errData.parserError));
    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      let text = "";

      const pages = Array.isArray(pdfData?.Pages) ? pdfData.Pages : [];
      pages.forEach((page: any) => {
        const texts = Array.isArray(page?.Texts) ? page.Texts : [];
        texts.forEach((t: any) => {
          const runs = Array.isArray(t?.R) ? t.R : [];
          runs.forEach((r: any) => {
            const raw = typeof r?.T === "string" ? r.T : "";
            const decoded = safeDecodeURIComponent(raw);
            text += decoded + " ";
          });
        });
      });

      // Normalize whitespace: convert many spaces into single, keep reasonable newlines
      const normalized = text
        .replace(/\s+\n/g, "\n")
        .replace(/\n\s+/g, "\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim();

      resolve(normalized);
    });
    pdfParser.loadPDF(pdfPath);
  });
}

// --- split text into readable sections ---
function chunkText(text: string, maxChars = 1000) {
  // Try to split on paragraphs first, then sentences if there are no newlines
  const rawParas = text.includes("\n") ? text.split(/\n+\s*/) : text.split(/(?<=[.!?])\s+/);
  const paras = rawParas.filter((p) => p && p.trim().length > 0);

  const chunks: { text: string; start: number; end: number }[] = [];
  let cur: string[] = [];
  let curLen = 0;
  let start = 0;

  paras.forEach((p, idx) => {
    const piece = p.trim();
    if (!piece) return;

    if (curLen + piece.length > maxChars && cur.length > 0) {
      chunks.push({ text: cur.join(" "), start, end: idx - 1 });
      cur = [piece];
      curLen = piece.length;
      start = idx;
    } else {
      cur.push(piece);
      curLen += piece.length;
    }
  });

  if (cur.length) chunks.push({ text: cur.join(" "), start, end: paras.length - 1 });
  return chunks;
}

// --- extract simple info cards from headings ---
function extractCards(text: string) {
  const lines = text.split("\n");
  const headings = lines
    .map((l) => l.trim())
    .filter((l) => /^[A-Z][A-Z0-9 \-:&]{5,}$/.test(l))
    .slice(0, 6);

  const bullets = lines
    .map((l) => l.trim())
    .filter((l) => /^(\-|\*|•)\s+/.test(l))
    .slice(0, 6);

  const cards = headings.map((h) => {
    const idx = lines.findIndex((x) => x.trim() === h);
    const body = lines.slice(idx + 1, idx + 3).join(" ").trim();
    return { title: h, body };
  });

  if (!cards.length && bullets.length) {
    cards.push({ title: "Key Points", body: bullets.join(" ") });
  }

  return cards;
}

// --- API handler ---
export async function POST() {
  try {
    const pdfPath = path.join(process.cwd(), "public", "genieve.pdf");
    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json({ success: false, error: "genieve.pdf not found" }, { status: 404 });
    }

    const text = await extractTextFromPDF(pdfPath);
    const chunks = chunkText(text);
    const cards = extractCards(text);

    await client.connect();
    const db = client.db("veracity101");

    await db.collection("talk_docs").deleteMany({ source: "genieve.pdf" });
    if (chunks.length > 0) {
      await db.collection("talk_docs").insertMany(
        chunks.map((c, i) => ({
          source: "genieve.pdf",
          chunk_index: i,
          text: c.text,
          createdAt: new Date(),
        }))
      );
    }

    return NextResponse.json({
      success: true,
      message: `Ingested ${chunks.length} chunks.`,
      cards,
      preview: chunks[0]?.text.slice(0, 400) ?? "",
    });
  } catch (err: any) {
    console.error("❌ Ingest error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Unknown error" }, { status: 500 });
  } finally {
    try {
      await client.close();
    } catch {
      // ignore close errors
    }
  }
}
