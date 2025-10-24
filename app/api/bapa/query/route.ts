import { NextResponse } from "next/server";
import { pipeline, env } from "@xenova/transformers";

export const runtime = "nodejs";
env.allowLocalModels = false;

// -----------------------------------------------------------------------------
//  Extract text from PDF using pdf-parse (Node-safe, no DOM)
// -----------------------------------------------------------------------------
async function extractTextFromPdf(buffer: Uint8Array): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(Buffer.from(buffer));
    return data.text.replace(/\s{2,}/g, " ").trim();
  } catch (err) {
    console.error("❌ PDF parse error:", err);
    throw new Error("Failed to extract text from PDF");
  }
}

// -----------------------------------------------------------------------------
//  Smart summary fallback
// -----------------------------------------------------------------------------
function generateSmartSummary(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const key = sentences
    .filter((s) =>
      /(risk|battery|CBAM|compliance|origin|supplier|passport|thermal|chain)/i.test(s)
    )
    .slice(0, 5);
  return key.length ? key.join(" ") : text.slice(0, 400) + "…";
}

// -----------------------------------------------------------------------------
//  POST route
// -----------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let text = "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      text = body.text || "";
    } else {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) throw new Error("No file uploaded");

      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      text = await extractTextFromPdf(uint8);
    }

    if (!text || text.length < 20) throw new Error("No readable text found");

    // Summarization
    let summary = "";
    try {
      const summarizer = await pipeline("summarization", "Xenova/distilbart-cnn-12-6");
      const result = await summarizer(text.slice(0, 3000));
      summary = result[0]?.summary_text || "";
    } catch (err) {
      console.warn("⚠️ Summarization failed, using fallback:", err);
      summary = generateSmartSummary(text);
    }

    const risks = [
      {
        title: "Thermal Risk",
        body: "Potential mentions of overheating or electrolyte degradation.",
        badge: "red",
        tags: ["Safety"],
      },
      {
        title: "Supply Chain Origin",
        body: "Mentions of CBAM, Chile lithium, or traceability gaps.",
        badge: "amber",
        tags: ["CBAM", "Origin"],
      },
      {
        title: "Provenance Disclosure",
        body: "Structured data suggests strong transparency compliance.",
        badge: "green",
        tags: ["Disclosure"],
      },
    ];

    return NextResponse.json({
      success: true,
      summary,
      tldr: summary.slice(0, 240),
      risks,
    });
  } catch (err: any) {
    console.error("❌ /api/bapa/query error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "PDF processing failed" },
      { status: 500 }
    );
  }
}
