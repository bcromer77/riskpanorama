// src/app/v1/chronozone/sentinel-image/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function toNum(v: string | null, fallback: number) {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

async function getSentinelToken() {
  const clientId = process.env.SENTINEL_CLIENT_ID;
  const clientSecret = process.env.SENTINEL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("MISSING_SENTINEL_ENV");
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

  const txt = await res.text();
  if (!res.ok) throw new Error(`TOKEN_${res.status}:${txt}`);

  const data = JSON.parse(txt);
  if (!data?.access_token) throw new Error("TOKEN_MISSING_ACCESS_TOKEN");

  return data.access_token as string;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // Inputs
    const lat = toNum(url.searchParams.get("lat"), 26.65);
    const lng = toNum(url.searchParams.get("lng"), 50.10);
    const date = url.searchParams.get("date") || "2026-03-02";
    const deg = toNum(url.searchParams.get("deg"), 0.12); // bbox half-size in degrees
    const width = toNum(url.searchParams.get("w"), 1024);
    const height = toNum(url.searchParams.get("h"), 1024);

    // Small bbox around point to avoid meters-per-pixel limits
    const minLat = lat - deg;
    const maxLat = lat + deg;
    const minLng = lng - deg;
    const maxLng = lng + deg;

    const bbox = [minLng, minLat, maxLng, maxLat]; // [W,S,E,N]

    // CRS: use the URI form (most reliable)
    const crs = "http://www.opengis.net/def/crs/EPSG/0/4326";

    const evalscript = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B02","B03","B04"] }],
    output: { bands: 3 }
  };
}
function evaluatePixel(s) {
  return [2.5*s.B04, 2.5*s.B03, 2.5*s.B02];
}`;

    const body = {
      input: {
        bounds: {
          bbox,
          properties: { crs },
        },
        data: [
          {
            type: "sentinel-2-l2a",
            dataFilter: {
              timeRange: {
                from: `${date}T00:00:00Z`,
                to: `${date}T23:59:59Z`,
              },
            },
          },
        ],
      },
      output: {
        width,
        height,
        responses: [{ identifier: "default", format: { type: "image/png" } }],
      },
      evalscript,
    };

    const token = await getSentinelToken();

    const res = await fetch("https://services.sentinel-hub.com/api/v1/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      // @ts-ignore
      cache: "no-store",
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json(
        { ok: false, status: res.status, raw: txt, bbox, width, height },
        { status: 500 }
      );
    }

    const img = await res.arrayBuffer();
    return new NextResponse(img, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "UNKNOWN_ERROR" },
      { status: 500 }
    );
  }
}
