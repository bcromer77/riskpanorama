export const runtime = "nodejs";

const EVENTS = [
  {
    id: "evt_ras_tanura_2026_03_02",
    title: "Ras Tanura disruption",
    category: "energy",
    severity: "high",
    startTime: "2026-03-02T08:00:00Z",
    location: { lat: 26.65, lng: 50.10 },
    summary:
      "Signals indicate drone/missile activity and precautionary shutdown risk at a major Saudi refining hub.",
    context: { tags: ["diesel", "refining", "gulf"], regions: ["GCC"], dependencies: ["shipping"] },
  },
  {
    id: "evt_ras_laffan_2026_03_02",
    title: "Qatar LNG disruption (Ras Laffan / Mesaieed)",
    category: "energy",
    severity: "high",
    startTime: "2026-03-02T09:00:00Z",
    location: { lat: 25.92, lng: 51.57 },
    summary:
      "Signals indicate precautionary LNG processing halt / force majeure risk affecting a major share of global LNG flows.",
    context: { tags: ["lng", "gas", "force-majeure"], regions: ["GCC"], dependencies: ["shipping"] },
  },
  {
    id: "evt_hormuz_2026_03_02",
    title: "Strait of Hormuz shipping standstill signals",
    category: "shipping",
    severity: "high",
    startTime: "2026-03-02T10:00:00Z",
    location: { lat: 26.55, lng: 56.25 },
    summary:
      "Signals indicate tanker hesitation/standstill and war-risk surcharges, impacting energy and broader freight costs.",
    context: { tags: ["insurance", "rerouting", "war-risk"], regions: ["GCC"], dependencies: ["energy"] },
  },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category"); // optional
  const filtered = category ? EVENTS.filter((e) => e.category === category) : EVENTS;

  return Response.json({ events: filtered });
}
