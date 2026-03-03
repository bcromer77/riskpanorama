// src/app/v1/chronozone/sentinel/process/route.ts
import { NextResponse } from "next/server";
import { getSentinelToken } from "@/lib/sentinel";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bboxStr = searchParams.get("bbox");
  const date = searchParams.get("date");
  const w = Number(searchParams.get("w") || 1024);
  const h = Number(searchParams.get("h") || 1024);

  if (!bboxStr || !date) {
    return NextResponse.json({ error: "Missing bbox or date" }, { status: 400 });
  }

  const bbox = bboxStr.split(",").map(Number);
  if (bbox.length !== 4 || bbox.some(isNaN)) {
    return NextResponse.json({ error: "Invalid bbox format" }, { status: 400 });
  }

  try {
    const token = await getSentinelToken();

    const body = {
      input: {
        bounds: {
          bbox,  // [minLng, minLat, maxLng, maxLat]
          properties: {
            // Correct Sentinel Hub CRS format (required for EPSG:4326)
            crs: "http://www.opengis.net/def/crs/EPSG/0/4326"
          }
        },
        data: [
          {
            type: "sentinel-2-l2a",
            dataFilter: {
              timeRange: {
                from: `${date}T00:00:00Z`,
                to: `${date}T23:59:59Z`,
              },
              // Optional: cloud cover filter (0–100%)
              maxCloudCoverage: 30,
            },
          },
        ],
      },
      evalscript: `
//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B02", "B03", "B04"] }],
    output: { bands: 3 }
  };
}
function evaluatePixel(sample) {
  return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02];
}
`,
      output: {
        width: w,
        height: h,
        responses: [{ identifier: "default", format: { type: "image/png" } }],
      },
    };

    const res = await fetch("https://services.sentinel-hub.com/api/v1/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Sentinel Hub API error: ${res.status} - ${errText}` },
        { status: res.status }
      );
    }

    const blob = await res.blob();

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err: any) {
    console.error("Sentinel proxy error:", err);
    return NextResponse.json(
      { error: "Internal server error while fetching imagery" },
      { status: 500 }
    );
  }
}
