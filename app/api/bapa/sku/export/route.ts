import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const MONGO_URI = process.env.MONGODB_URI!;
const MONGO_DB = process.env.MONGODB_DB!;

export async function POST(req: Request) {
  const { sku } = await req.json();
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(MONGO_DB);
  const doc = await db.collection("bapa_documents").findOne({});

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const draw = (text: string, y: number, size = 12) =>
    page.drawText(text, { x: 50, y, size, font, color: rgb(0, 0.5, 0.2) });

  draw(`Battery Passport Compliance Report`, height - 50, 20);
  draw(`SKU: ${sku}`, height - 80);
  draw(`Generated: ${new Date().toLocaleString()}`, height - 100);
  draw(`Classification: 🛍️ Floor — Consumer & Brand Risk`, height - 130);
  draw(`Data Source: ${doc?.filename || "—"}`, height - 150);

  const pdfBytes = await pdfDoc.save();
  await client.close();

  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${sku}-CompliancePack.pdf"`,
    },
  });
}

