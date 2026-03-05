import type { EventPack } from "@/lib/api";

export const runtime = "nodejs";

// Map UI marker IDs → actual pack IDs
const ALIASES: Record<string, string> = {
  // Flashpoints hard-coded in WorldMonitorMap.tsx
  "tel-aviv": "fp-tel-aviv",
  "riyadh": "fp-riyadh",
  "beirut": "fp-beirut",
  "tehran": "fp-tehran",
  "damascus": "fp-damascus",
  "baghdad": "fp-baghdad",

  // Friendly slugs if you ever use them
  "ras-laffan": "evt_ras_laffan_2026_03_02",
  "strait-of-hormuz": "evt_hormuz_2026_03_02",
};

function sortSignals(pack: EventPack): EventPack {
  const cloned: EventPack =
    typeof structuredClone === "function"
      ? structuredClone(pack)
      : (JSON.parse(JSON.stringify(pack)) as EventPack);

  cloned.signals = [...(cloned.signals ?? [])].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  return cloned;
}

// ✅ SINGLE source of truth for packs
const PACKS: Record<string, EventPack> = {
  // ─────────────────────────────────────────
  // YOUR 3 MAIN DEMO EVENTS (keep as-is)
  // ─────────────────────────────────────────

  "evt_ras_tanura_2026_03_02": {
    event: {
      id: "evt_ras_tanura_2026_03_02",
      title: "Ras Tanura Refinery Disruption",
      category: "energy",
      severity: "high",
      startTime: "2026-03-02T07:00:00Z",
      location: { lat: 26.65, lng: 50.10 },
      summary:
        "Multiple signals indicate physical and cyber disruption risk at Saudi Arabia's largest oil refinery complex.",
    },
    signals: [
      {
        id: "sig_rt_001",
        eventId: "evt_ras_tanura_2026_03_02",
        time: "2026-03-02T07:10:00Z",
        sourceType: "x",
        confidence: "medium",
        text: "Multiple posts report explosions / intercepts near Ras Tanura; debris cloud visible.",
        sourceRef: "https://x.com/SaudiNews50/status/1764567890123456789",
        tags: ["explosion", "intercept"],
      },
      {
        id: "sig_rt_002",
        eventId: "evt_ras_tanura_2026_03_02",
        time: "2026-03-02T08:30:00Z",
        sourceType: "news",
        confidence: "high",
        text: "Saudi Aramco confirms operational slowdown pending safety assessment.",
        sourceRef: "https://www.aramco.com/en/news-media/news/2026/ras-tanura-update",
        tags: ["slowdown", "assessment"],
      },
      {
        id: "sig_rt_003",
        eventId: "evt_ras_tanura_2026_03_02",
        time: "2026-03-02T10:15:00Z",
        sourceType: "official",
        confidence: "high",
        text: "Saudi Energy Ministry: diesel export nominations reduced for March loadings.",
        sourceRef: "https://mopm.gov.sa/news/2026-03-02-diesel-nominations",
        tags: ["export", "nomination"],
      },
      {
        id: "sig_rt_004",
        eventId: "evt_ras_tanura_2026_03_02",
        time: "2026-03-02T11:40:00Z",
        sourceType: "other",
        confidence: "medium",
        text: "GCC trucking groups discussing immediate diesel surcharges for cross-border hauls.",
        sourceRef: "",
        tags: ["trucking", "surcharge"],
      },
      {
        id: "sig_rt_005",
        eventId: "evt_ras_tanura_2026_03_02",
        time: "2026-03-02T13:20:00Z",
        sourceType: "x",
        confidence: "medium",
        text: "Supermarket procurement desks querying suppliers on diesel-linked cost adjustment clauses.",
        sourceRef: "https://x.com/GCCLogistics/status/1764601234567890123",
        tags: ["supermarket", "pass-through"],
      },
      {
        id: "sig_rt_006",
        eventId: "evt_ras_tanura_2026_03_02",
        time: "2026-03-02T15:00:00Z",
        sourceType: "satellite",
        confidence: "high",
        text: "MODIS satellite imagery shows smoke plume over Ras Tanura refinery complex.",
        sourceRef:
          "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2026-03-02/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg",
        tags: ["smoke", "satellite"],
      },
    ],
    secondOrderRisks: [
      {
        id: "rsk_rt_001",
        eventId: "evt_ras_tanura_2026_03_02",
        timeHorizon: "0-60 days",
        sector: "food retail / cold-chain",
        risk: "Diesel cost inflation",
        mechanism: "Refinery downtime → tighter middle distillate supply → higher trucking rates",
        commercialImpact: "Margin pressure on perishables; potential shelf-price increases.",
      },
      {
        id: "rsk_rt_002",
        eventId: "evt_ras_tanura_2026_03_02",
        timeHorizon: "30-120 days",
        sector: "food processing & packaging",
        risk: "Resin & transport cost passthrough",
        mechanism: "Diesel tightness → higher cost of moving PET/HDPE resin and finished goods",
        commercialImpact:
          "Private-label packaging and transport costs rise → own-brand profitability squeeze.",
      },
      {
        id: "rsk_rt_003",
        eventId: "evt_ras_tanura_2026_03_02",
        timeHorizon: "60-180 days",
        sector: "chemicals & fertilizers",
        risk: "Naphtha & gasoil feedstock volatility",
        mechanism: "Refinery output cut → upstream cost pressure on petrochemicals",
        commercialImpact:
          "Higher input costs for plastics, fertilizers → downstream price pressure.",
      },
    ],
    procurementSignals: [
      {
        id: "ps_rt_001",
        eventId: "evt_ras_tanura_2026_03_02",
        type: "mispricing",
        signal:
          "Forward diesel quotes remain largely unchanged despite physical tightness",
        implication:
          "Current bids may appear competitive but likely embed deferred cost exposure.",
      },
      {
        id: "ps_rt_002",
        eventId: "evt_ras_tanura_2026_03_02",
        type: "absence",
        signal:
          "Limited hedging or diesel surcharge announcements from major supermarket logistics fleets",
        implication:
          "Unhedged exposure to spot diesel volatility persists in distribution contracts.",
      },
      {
        id: "ps_rt_003",
        eventId: "evt_ras_tanura_2026_03_02",
        type: "withdrawal",
        signal: "Some regional diesel suppliers quietly withdrawing Q2 delivery offers",
        implication: "Supply-side caution already visible.",
      },
    ],
    assessment: {
      assumptions: [
        "Middle-distillate supply remains broadly stable regionally",
        "Freight and war-risk premiums near baseline",
        "No prolonged outage at Ras Tanura",
      ],
      observed: [
        "Physical disruption signals near major refinery node",
        "Limited operator visibility on restart timeline",
        "Early freight, insurance, and logistics repricing chatter",
      ],
      assessment:
        "Current pricing continues to reflect pre-event conditions; adjustment lag appears present.",
      implication:
        "New fuel, logistics, or distribution-linked contracts signed in the next 14–30 days may embed deferred cost pass-through rather than genuine efficiency.",
      rangePct: { low: 8, high: 18 },
      confidence: "medium",
      confidenceRationale:
        "Multiple converging indicators; operator clarity on duration remains limited.",
    },
  },

  "evt_ras_laffan_2026_03_02": {
    event: {
      id: "evt_ras_laffan_2026_03_02",
      title: "Ras Laffan LNG Processing Disruption",
      category: "energy",
      severity: "high",
      startTime: "2026-03-02T09:00:00Z",
      location: { lat: 25.92, lng: 51.57 },
      summary:
        "QatarEnergy declared Force Majeure on LNG and associated products after a production halt at Ras Laffan.",
    },
    signals: [
      {
        id: "sig_rl_001",
        eventId: "evt_ras_laffan_2026_03_02",
        time: "2026-03-02T09:10:00Z",
        sourceType: "x",
        confidence: "medium",
        text: "Posts describe impacts near LNG trains; operators in assessment mode.",
        sourceRef: "https://x.com/qatarenergy/status/1764000000000000000",
        tags: ["lng", "facility"],
      },
      {
        id: "sig_rl_006",
        eventId: "evt_ras_laffan_2026_03_02",
        time: "2026-03-04T12:24:20Z",
        sourceType: "official",
        confidence: "high",
        text: "QatarEnergy declares Force Majeure to its affected buyers.",
        sourceRef: "https://x.com/qatarenergy/status/2029171082444312660",
        tags: ["force-majeure", "declaration", "lng", "official-notice"],
      },
    ],
    assessment: {
      assumptions: [
        "LNG supply continuity is intact",
        "No material force majeure impact on cargo schedules",
      ],
      observed: ["Official force majeure declaration"],
      assessment:
        "Spot markets react immediately; term contracts reprice more slowly.",
      implication:
        "New contracts signed now likely carry deferred exposure as LNG and downstream inputs reprice.",
      rangePct: { low: 12, high: 28 },
      confidence: "high",
      confidenceRationale:
        "Official FM declaration from QatarEnergy is direct, on-record.",
    },
  },

  "evt_hormuz_2026_03_02": {
    event: {
      id: "evt_hormuz_2026_03_02",
      title: "Strait of Hormuz Shipping Disruption Signals",
      category: "shipping",
      severity: "high",
      startTime: "2026-03-02T10:00:00Z",
      location: { lat: 26.55, lng: 56.25 },
      summary:
        "AIS + market chatter suggest tanker hesitation and potential transit constraints.",
    },
    signals: [
      {
        id: "sig_hz_001",
        eventId: "evt_hormuz_2026_03_02",
        time: "2026-03-02T10:10:00Z",
        sourceType: "x",
        confidence: "medium",
        text: "Maritime channels report tanker slowdowns and hesitation near the chokepoint.",
        tags: ["shipping", "chokepoint"],
      },
    ],
  },

  // ─────────────────────────────────────────
  // FLASHPOINT PACKS (to prevent RightPanel 404)
  // These match the map marker IDs via ALIASES.
  // ─────────────────────────────────────────

  "fp-tel-aviv": {
    event: {
      id: "fp-tel-aviv",
      title: "Tel Aviv Security Alert",
      category: "security",
      severity: "high",
      startTime: "2026-03-04T06:00:00Z",
      location: { lat: 32.0853, lng: 34.7818 },
      summary: "Heightened alert posture following regional escalation.",
    },
    signals: [
      {
        id: "sig_tlv_001",
        eventId: "fp-tel-aviv",
        time: "2026-03-04T06:15:00Z",
        sourceType: "x",
        confidence: "medium",
        text: "Multiple reports of increased air defence activity over Tel Aviv.",
        tags: ["air-defense", "alert"],
      },
    ],
  },

  "fp-riyadh": {
    event: {
      id: "fp-riyadh",
      title: "Riyadh Heightened Security Posture",
      category: "security",
      severity: "medium",
      startTime: "2026-03-04T06:00:00Z",
      location: { lat: 24.7136, lng: 46.6753 },
      summary: "Increased posture + defensive activity signals.",
    },
    signals: [
      {
        id: "sig_riy_001",
        eventId: "fp-riyadh",
        time: "2026-03-04T06:30:00Z",
        sourceType: "x",
        confidence: "medium",
        text: "Reports of increased air defence readiness and checkpoints.",
        tags: ["air-defense", "checkpoint"],
      },
    ],
  },

  "fp-beirut": {
    event: {
      id: "fp-beirut",
      title: "Beirut Tension Signals",
      category: "conflict",
      severity: "high",
      startTime: "2026-03-04T06:00:00Z",
      location: { lat: 33.8938, lng: 35.5018 },
      summary: "Tension signals and elevated rhetoric.",
    },
    signals: [
      {
        id: "sig_beir_001",
        eventId: "fp-beirut",
        time: "2026-03-04T07:00:00Z",
        sourceType: "x",
        confidence: "low",
        text: "Chatter indicates rising tensions and alerts.",
        tags: ["tension"],
      },
    ],
  },

  "fp-tehran": {
    event: {
      id: "fp-tehran",
      title: "Tehran Escalation Signals",
      category: "nuclear",
      severity: "high",
      startTime: "2026-03-04T06:00:00Z",
      location: { lat: 35.6892, lng: 51.389 },
      summary: "Escalation signals and heightened diplomatic posture.",
    },
    signals: [
      {
        id: "sig_thr_001",
        eventId: "fp-tehran",
        time: "2026-03-04T07:00:00Z",
        sourceType: "x",
        confidence: "low",
        text: "Escalation chatter; watch for official confirmation.",
        tags: ["diplomatic"],
      },
    ],
  },

  "fp-damascus": {
    event: {
      id: "fp-damascus",
      title: "Damascus Security Signals",
      category: "security",
      severity: "medium",
      startTime: "2026-03-04T06:00:00Z",
      location: { lat: 33.5138, lng: 36.2765 },
      summary: "Security posture and disruption signals.",
    },
    signals: [
      {
        id: "sig_dam_001",
        eventId: "fp-damascus",
        time: "2026-03-04T07:00:00Z",
        sourceType: "x",
        confidence: "low",
        text: "Reports suggest elevated posture.",
        tags: ["security"],
      },
    ],
  },

  "fp-baghdad": {
    event: {
      id: "fp-baghdad",
      title: "Baghdad Stability Signals",
      category: "stability",
      severity: "medium",
      startTime: "2026-03-04T06:00:00Z",
      location: { lat: 33.3152, lng: 44.3661 },
      summary: "Stability posture and disruption signals.",
    },
    signals: [
      {
        id: "sig_bag_001",
        eventId: "fp-baghdad",
        time: "2026-03-04T07:00:00Z",
        sourceType: "x",
        confidence: "low",
        text: "Chatter indicates heightened alert posture.",
        tags: ["stability"],
      },
    ],
  },
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  const normalizedId = ALIASES[eventId] ?? eventId;
  const pack = PACKS[normalizedId];

  if (!pack) {
    return new Response(
      JSON.stringify({
        error: "EVENT_NOT_FOUND",
        eventId,
        normalizedId,
        knownIdsSample: Object.keys(PACKS).slice(0, 25),
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  return Response.json(sortSignals(pack));
}
