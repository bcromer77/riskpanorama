import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = searchParams.get("radius") || "50"; // km

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
  }

  // FIRMS bounding box
  const delta = parseFloat(radius) / 111; // rough km to degrees
  const minLat = parseFloat(lat) - delta;
  const maxLat = parseFloat(lat) + delta;
  const minLng = parseFloat(lng) - delta;
  const maxLng = parseFloat(lng) + delta;

  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/VIIRS_SNPP_NRT/${minLng},${minLat},${maxLng},${maxLat}/3`;

  const res = await fetch(url);

  if (!res.ok) {
    return NextResponse.json({ error: "FIRMS fetch failed" }, { status: 500 });
  }

  const text = await res.text();

  return NextResponse.json({ raw: text });
}
