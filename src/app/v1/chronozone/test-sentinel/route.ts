// src/app/v1/chronozone/test-sentinel/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const clientId = process.env.SENTINEL_CLIENT_ID;
    const clientSecret = process.env.SENTINEL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          ok: false,
          error: "MISSING_SENTINEL_ENV",
          hint: "Set SENTINEL_CLIENT_ID and SENTINEL_CLIENT_SECRET in .env.local (server-side, no NEXT_PUBLIC_*)",
        },
        { status: 400 }
      );
    }

    const params = new URLSearchParams();
    params.set("grant_type", "client_credentials");

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const res = await fetch("https://services.sentinel-hub.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: params.toString(),
      // @ts-ignore
      cache: "no-store",
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, status: res.status, raw: text },
        { status: 500 }
      );
    }

    const data = JSON.parse(text);
    const token = data?.access_token as string | undefined;

    return NextResponse.json({
      ok: true,
      tokenLength: token?.length ?? 0,
      expiresIn: data?.expires_in ?? null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "UNKNOWN_ERROR" },
      { status: 500 }
    );
  }
}
