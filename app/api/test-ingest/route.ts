import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Extract text using pdf2json via dynamic require (avoids Turbopack static analysis)
async function extractWithPdf2Json(buffer: Buffer): Promise<string> {
  // Load pdf2json only at runtime to avoid bundler issues
  const req = (module as any).require || require;
  const PDFParser = req('pdf2json');
  const parser = new PDFParser(null, 1);

  const text: string = await new Promise((resolve, reject) => {
    parser.on('pdfParser_dataError', (err: any) => reject(err));
    parser.on('pdfParser_dataReady', () => {
      try {
        const raw = parser.getRawTextContent() || '';
        resolve(raw.replace(/\s{2,}/g, ' ').trim());
      } catch (e) {
        reject(e);
      }
    });
    parser.parseBuffer(buffer);
  });

  return text;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractWithPdf2Json(buffer);

    if (!text || text.length < 20) {
      return NextResponse.json({ error: 'No extractable text in PDF' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      textLength: text.length,
      preview: text.slice(0, 300),
    });
  } catch (err: any) {
    console.error('test-ingest error:', err);
    return NextResponse.json({ error: err.message || 'Failed to parse PDF' }, { status: 500 });
  }
}
