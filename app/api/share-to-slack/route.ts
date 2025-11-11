// app/api/share-to-slack/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  // you can put your real Slack webhook in .env.local
  const webhook = process.env.SLACK_WEBHOOK_URL;

  const payload = {
    text: `📦 Battery / Supply-Chain Update\n*${body.title || "Untitled"}*\n${body.summary || ""}`,
  };

  if (webhook) {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } else {
    console.log("⚠️ No SLACK_WEBHOOK_URL set, logging instead:", payload);
  }

  return NextResponse.json({ ok: true });
}

