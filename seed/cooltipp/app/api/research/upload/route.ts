import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { embedPDF } from "@/lib/embedPDF";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const researcher = formData.get("researcher") as string;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { summary, keywords } = await embedPDF(buffer);

    const client = await MongoClient.connect(process.env.MONGODB_URI!);
    const db = client.db("veracity101");

    await db.collection("research_refs").insertOne({
      researcher,
      fileName: file.name,
      summary,
      keywords,
      createdAt: new Date(),
    });

    client.close();

    return NextResponse.json({
      success: true,
      message: `Research uploaded by ${researcher}`,
      summary,
      keywords,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

