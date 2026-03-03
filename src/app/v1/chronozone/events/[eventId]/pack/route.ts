import type { EventPack } from "@/lib/api";

export const runtime = "nodejs";

const EID_RT = "evt_ras_tanura_2026_03_02";
const EID_RL = "evt_ras_laffan_2026_03_02";
const EID_HZ = "evt_hormuz_2026_03_02";

const PACKS: Record<string, EventPack> = {
  [EID_RT]: {
    event: {
      id: EID_RT,
      title: "Ras Tanura Refinery Disruption",
      category: "energy",
      severity: "high",
      startTime: "2026-03-02T07:00:00Z",
      location: { lat: 26.65, lng: 50.10 },
      summary:
        "Signals indicate disruption risk at a major refining node; diesel export flows may be affected.",
    },
    signals: [
      {
        id: "sig_rt_001",
        eventId: EID_RT,
        time: "2026-03-02T07:10:00Z",
        sourceType: "x",
        confidence: "medium",
        text: "Multiple posts report intercepts near Ras Tanura; debris fallout visible in satellite imagery.",
        sourceRef: "",
        tags: ["intercept", "debris"],
      },
      {
        id: "sig_rt_002",
        eventId: EID_RT,
        time: "2026-03-02T08:30:00Z",
        sourceType: "news",
        confidence: "high",
        text: "Reports indicate precautionary operational slowdown / partial shutdown pending full assessment.",
        sourceRef: "",
        tags: ["shutdown", "assessment"],
      },
      {
        id: "sig_rt_003",
        eventId: EID_RT,
        time: "2026-03-02T10:15:00Z",
        sourceType: "other",
        confidence: "medium",
        text: "Early freight and insurance chatter begins around diesel/gasoil delivery repricing.",
        sourceRef: "",
        tags: ["freight", "insurance"],
      },
      {
        id: "sig_rt_004",
        eventId: EID_RT,
        time: "2026-03-02T11:40:00Z",
        sourceType: "x",
        confidence: "low",
        text: "GCC truckers and logistics groups discussing potential diesel surcharges for intra-regional hauls.",
        sourceRef: "",
        tags: ["trucking", "surcharge"],
      },
      {
        id: "sig_rt_005",
        eventId: EID_RT,
        time: "2026-03-02T13:20:00Z",
        sourceType: "x",
        confidence: "medium",
        text: "Supermarket supply chain managers asking suppliers about diesel-linked cost adjustment clauses.",
        sourceRef: "",
        tags: ["supermarket", "cost-pass-through"],
      },
    ],
    secondOrderRisks: [
      {
        id: "rsk_rt_001",
        eventId: EID_RT,
        timeHorizon: "0-60 days",
        sector: "food retail / cold-chain logistics",
        risk: "Diesel-driven distribution cost inflation",
        mechanism:
          "Higher fuel prices → increased trucking rates for fresh produce and frozen goods",
        commercialImpact:
          "Margin pressure on perishables; potential need for shelf-price adjustments.",
      },
      {
        id: "rsk_rt_002",
        eventId: EID_RT,
        timeHorizon: "30-120 days",
        sector: "food processing & packaging",
        risk: "Middle distillate tightness → resin & transport cost passthrough",
        mechanism:
          "Diesel scarcity → higher cost of moving PET/HDPE resin and finished goods",
        commercialImpact:
          "Private-label packaging and transport costs rise → own-brand profitability squeeze.",
      },
    ],
    procurementSignals: [
      {
        id: "ps_rt_001",
        eventId: EID_RT,
        type: "mispricing",
        signal:
          "Forward diesel quotes and supplier pricing remain largely unchanged despite emerging tightness",
        implication:
          "Current bids may appear competitive but likely embed deferred cost exposure.",
      },
      {
        id: "ps_rt_002",
        eventId: EID_RT,
        type: "absence",
        signal:
          "Limited hedging or diesel surcharge announcements from major supermarket logistics fleets",
        implication:
          "Unhedged exposure to spot diesel volatility persists in distribution contracts.",
      },
    ],
    assessment: {
      assumptions: [
        "Regional middle-distillate supply remains broadly stable",
        "Freight and war-risk premiums stay near baseline levels",
        "No prolonged outage at key refining nodes",
      ],
      observed: [
        "Intercept and disruption signals near major refinery node",
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
        "Multiple converging indicators from social, news, and market sources; operator clarity on duration remains limited.",
    },
  },

  [EID_RL]: {
    event: {
      id: EID_RL,
      title: "Ras Laffan LNG Processing Disruption",
      category: "energy",
      severity: "high",
      startTime: "2026-03-02T09:00:00Z",
      location: { lat: 25.92, lng: 51.57 },
      summary:
        "Signals suggest significant processing disruption risk at a major LNG export facility.",
    },
    signals: [
      {
        id: "sig_rl_001",
        eventId: EID_RL,
        time: "2026-03-02T09:10:00Z",
        sourceType: "x",
        confidence: "medium",
        text: "Posts describe impacts near LNG trains; operators in assessment mode.",
        sourceRef: "",
        tags: ["lng", "facility"],
      },
      {
        id: "sig_rl_002",
        eventId: EID_RL,
        time: "2026-03-02T10:45:00Z",
        sourceType: "news",
        confidence: "medium",
        text: "Reports reference precautionary halts and language consistent with force majeure declarations.",
        sourceRef: "",
        tags: ["force-majeure", "halt"],
      },
      {
        id: "sig_rl_003",
        eventId: EID_RL,
        time: "2026-03-02T12:30:00Z",
        sourceType: "news",
        confidence: "medium",
        text: "Spot LNG prices showing rapid upward movement in Asia and Europe hubs.",
        sourceRef: "",
        tags: ["spot", "price-spike"],
      },
      {
        id: "sig_rl_004",
        eventId: EID_RL,
        time: "2026-03-02T14:15:00Z",
        sourceType: "other",
        confidence: "medium",
        text: "Fertilizer producers and agribusiness groups warning of potential urea/ammonia feedstock constraints.",
        sourceRef: "",
        tags: ["fertilizer", "urea", "ammonia"],
      },
      {
        id: "sig_rl_005",
        eventId: EID_RL,
        time: "2026-03-02T16:00:00Z",
        sourceType: "x",
        confidence: "low",
        text: "Food retail procurement teams beginning to query nitrogen fertilizer contract flexibility.",
        sourceRef: "",
        tags: ["supermarket", "fertilizer", "procurement"],
      },
    ],
    secondOrderRisks: [
      {
        id: "rsk_rl_001",
        eventId: EID_RL,
        timeHorizon: "30-120 days",
        sector: "agriculture / fresh produce",
        risk: "Nitrogen fertilizer cost shock",
        mechanism:
          "Natural gas feedstock tightness → urea/ammonia prices rise sharply",
        commercialImpact:
          "Higher input costs for growers → elevated fresh produce prices at retail.",
      },
      {
        id: "rsk_rl_002",
        eventId: EID_RL,
        timeHorizon: "60-180 days",
        sector: "food retail / frozen & chilled",
        risk: "Refrigerant and cold-chain gas cost escalation",
        mechanism:
          "LNG tightness flows through to CO₂ and other refrigerant pricing",
        commercialImpact:
          "Increased spoilage risk and operating costs in fresh/frozen departments.",
      },
    ],
    procurementSignals: [
      {
        id: "ps_rl_001",
        eventId: EID_RL,
        type: "withdrawal",
        signal:
          "Fertilizer and ag-input suppliers delaying or withdrawing Q2/Q3 delivery bids",
        implication:
          "Upstream cost escalation already anticipated by producers.",
      },
      {
        id: "ps_rl_002",
        eventId: EID_RL,
        type: "mispricing",
        signal:
          "Current frozen and chilled goods contracts remain priced at pre-disruption levels",
        implication:
          "Deferred exposure likely to emerge at next renewal or indexation point.",
      },
    ],
    assessment: {
      assumptions: [
        "LNG supply continuity is intact",
        "No material force majeure impact on cargo schedules",
        "Spot LNG competition remains orderly",
      ],
      observed: [
        "Processing disruption signals and precautionary halt reports",
        "Language consistent with force majeure declarations",
        "Absence of clear restart or substitution confirmation",
      ],
      assessment:
        "Spot markets react quickly to headlines; long-term contract pricing often lags operational reality.",
      implication:
        "Contracts and positions initiated now likely carry deferred exposure as LNG, fertilizer, and downstream food inputs reprice.",
      rangePct: { low: 12, high: 28 },
      confidence: "medium",
      confidenceRationale:
        "Strong convergence of reporting and operator posture; limited refuting detail available.",
    },
  },

  [EID_HZ]: {
    event: {
      id: EID_HZ,
      title: "Strait of Hormuz Shipping Disruption Signals",
      category: "shipping",
      severity: "high",
      startTime: "2026-03-02T10:00:00Z",
      location: { lat: 26.55, lng: 56.25 },
      summary:
        "Market chatter and AIS data suggest tanker hesitation and potential transit constraints.",
    },
    signals: [
      {
        id: "sig_hz_001",
        eventId: EID_HZ,
        time: "2026-03-02T10:10:00Z",
        sourceType: "x",
        confidence: "medium",
        text: "Maritime social channels report tanker slowdowns and hesitation near the chokepoint.",
        sourceRef: "",
        tags: ["shipping", "chokepoint"],
      },
      {
        id: "sig_hz_002",
        eventId: EID_HZ,
        time: "2026-03-02T12:00:00Z",
        sourceType: "news",
        confidence: "medium",
        text: "War-risk insurance surcharges and rerouting discussions gaining traction.",
        sourceRef: "",
        tags: ["insurance", "rerouting"],
      },
      {
        id: "sig_hz_003",
        eventId: EID_HZ,
        time: "2026-03-02T13:45:00Z",
        sourceType: "other",
        confidence: "medium",
        text: "Reefer container rates showing sharp upward pressure in GCC export corridors.",
        sourceRef: "",
        tags: ["reefer", "rate-spike"],
      },
      {
        id: "sig_hz_004",
        eventId: EID_HZ,
        time: "2026-03-02T15:30:00Z",
        sourceType: "x",
        confidence: "low",
        text: "Fresh produce importers flagging increased spoilage risk on delayed Asia–Europe legs.",
        sourceRef: "",
        tags: ["produce", "spoilage", "delay"],
      },
      {
        id: "sig_hz_005",
        eventId: EID_HZ,
        time: "2026-03-02T17:10:00Z",
        sourceType: "news",
        confidence: "medium",
        text: "Container lines announce temporary GCC-linked surcharges for refrigerated cargo.",
        sourceRef: "",
        tags: ["container", "surcharge", "reefer"],
      },
    ],
    secondOrderRisks: [
      {
        id: "rsk_hz_001",
        eventId: EID_HZ,
        timeHorizon: "0-90 days",
        sector: "food retail / perishables",
        risk: "Reefer freight and cold-chain cost surge",
        mechanism:
          "War-risk + rerouting → 25–50% increase in landed cost for imported fruit, vegetables, seafood",
        commercialImpact:
          "Higher waste rates, price volatility, and potential shelf availability gaps.",
      },
      {
        id: "rsk_hz_002",
        eventId: EID_HZ,
        timeHorizon: "30-180 days",
        sector: "supermarket dry goods & promotions",
        risk: "Container equipment scarcity and repositioning delays",
        mechanism:
          "Box shortages due to disrupted trade flows → delayed arrivals of packaged / ambient goods",
        commercialImpact:
          "Disrupted promotional planning; inventory imbalances in non-perishable categories.",
      },
    ],
    procurementSignals: [
      {
        id: "ps_hz_001",
        eventId: EID_HZ,
        type: "mispricing",
        signal:
          "Current import freight and landed-cost contracts remain priced at pre-event levels",
        implication:
          "Deferred surcharges and pass-through likely to appear at next shipment or renewal.",
      },
      {
        id: "ps_hz_002",
        eventId: EID_HZ,
        type: "absence",
        signal:
          "No widespread activation of alternative sourcing corridors or overland options",
        implication:
          "Continued heavy reliance on Gulf/Indian Ocean routes increases exposure.",
      },
    ],
    assessment: {
      assumptions: [
        "Chokepoint transit remains normal",
        "War-risk premiums stable",
        "Rerouting and delay risk minimal",
      ],
      observed: [
        "Tanker hesitation and standstill signals in critical chokepoint",
        "War-risk insurance surcharges and rerouting discussions",
        "No confident alternative routing or substitution announcements",
      ],
      assessment:
        "Freight and insurance repricing typically appears with a delay relative to physical signals.",
      implication:
        "Supplier bids and landed costs may appear competitive temporarily while freight/insurance pass-through is deferred to renewal or next invoicing cycle.",
      rangePct: { low: 6, high: 16 },
      confidence: "medium",
      confidenceRationale:
        "Consistent insurance, freight, and operator behavior signals; duration and full policy response still uncertain.",
    },
  },

  // You can continue adding the other 10 events here in the same corrected pattern
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const pack = PACKS[eventId];

  if (!pack) {
    return new Response(JSON.stringify({ error: "EVENT_NOT_FOUND" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Sort signals chronologically
  pack.signals.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  return Response.json(pack);
}
