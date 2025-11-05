import { NextRequest, NextResponse } from "next/server";

// ✅ FIX: must make this an async function and await params
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params; // ✅ await fixes the error

  // Example static data for Galina — later this will come from MongoDB
  if (slug === "galina-kennedy") {
    return NextResponse.json({
      name: "Dr. Galina Kennedy",
      title: "Researcher, Energy Systems Integration | NexSys",
      bio: "Galina is pioneering the integration of distributed battery networks and thermal recovery systems across rural Ireland to meet EU NIS2 resilience and energy efficiency standards.",
      externalUrl:
        "https://www.nexsys-energy.ie/nexsysresearch/researcherspotlight/galinakennedy/",
      photo: "/galina.jpg", // put this in /public folder

      research: [
        {
          title: "Therminic Paper 2025 — Thermal Recovery in Data Centres",
          summary:
            "Demonstrates heat recovery efficiencies up to 55% from high-load compute environments and outlines micro-grid integration strategies for rural substations.",
        },
        {
          title: "Distributed Battery Networks for Agri-Grid Stabilisation",
          summary:
            "Explores how farm-scale lithium storage can absorb data-centre surplus, feed back during rural demand peaks, and turn farms from cost centres into resilience assets.",
        },
      ],

      network: {
        nodes: [
          { id: "Galina Kennedy", group: "researcher" },
          { id: "Tipperary County Council", group: "policy" },
          { id: "SEAI", group: "funding" },
          { id: "ESB Networks", group: "infrastructure" },
          { id: "NIS2 Directive", group: "policy" },
        ],
        links: [
          { source: "Galina Kennedy", target: "Tipperary County Council" },
          { source: "Galina Kennedy", target: "SEAI" },
          { source: "Galina Kennedy", target: "ESB Networks" },
          { source: "SEAI", target: "NIS2 Directive" },
        ],
      },
    });
  }

  // fallback — if unknown researcher slug
  return NextResponse.json(
    { error: `Researcher profile not found for '${slug}'` },
    { status: 404 }
  );
}

