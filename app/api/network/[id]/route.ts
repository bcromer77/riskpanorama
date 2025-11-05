import { NextResponse } from "next/server";

// Fake graph data for demo — you can later swap this for a MongoDB lookup
const NETWORKS: Record<string, any> = {
  seai: {
    nodes: [
      { id: "seai", name: "SEAI", group: "funding" },
      { id: "clare", name: "Clare County", group: "county" },
      { id: "limerick", name: "Limerick County", group: "county" },
      { id: "ed-obrien", name: "Ed O'Brien", group: "researcher" },
    ],
    links: [
      { source: "seai", target: "clare" },
      { source: "seai", target: "limerick" },
      { source: "seai", target: "ed-obrien" },
    ],
  },

  tipp: {
    nodes: [
      { id: "tipp", name: "Tipperary", group: "county" },
      { id: "seai", name: "SEAI", group: "funding" },
      { id: "galina", name: "Galina Kennedy", group: "researcher" },
    ],
    links: [
      { source: "tipp", target: "seai" },
      { source: "tipp", target: "galina" },
    ],
  },
};

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const data = NETWORKS[id.toLowerCase()];

  if (!data) {
    return NextResponse.json({ nodes: [], links: [] }, { status: 200 });
  }

  return NextResponse.json(data);
}

