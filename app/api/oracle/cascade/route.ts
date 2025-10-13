import { NextResponse } from "next/server";
import { runCascade } from "@/lib/oracle";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ ok: false, error: "Missing query" });
    }

    console.log("🌊 Oracle cascade for:", query);
    const cascades = await runCascade(query);

    return NextResponse.json({ ok: true, cascades });
  } catch (err: any) {
    console.error("❌ Oracle cascade error:", err);
    return NextResponse.json({ ok: false, error: err.message || "Unknown error" });
  }
}

