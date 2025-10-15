// lib/mockData.js
// Mock data for RiskPanorama's "Super Grok" trending risk intelligence feed

export const trendingSignals = [
  {
    topic: "Panama Canal Drought",
    mentions: 184000,
    momentum: +22,
    riskVector: "Supply Chain",
    riskScore: 0.82,
    narrative:
      "Container backlogs at the Panama Canal now exceed 200 ships. Logistics costs are rising 18% month-on-month — rerouting via Suez adds 11 days to average transit. Expect higher input costs for consumer goods by Q4.",
    signalStrength: 0.88,
    relatedEntities: ["Maersk", "Walmart", "Tesla", "Coca-Cola"],
    agentNote:
      "Scout: tracking vessel delays • Interpreter: correlating with inventory stress • Narrator: flagging cascading inflationary signals.",
  },
  {
    topic: "AI Hardware Shortage",
    mentions: 342000,
    momentum: +33,
    riskVector: "Market / Tech Infrastructure",
    riskScore: 0.79,
    narrative:
      "GPU and H100 shortages extend into 2026 — cloud providers rationing compute capacity. Firms reliant on AI inference may face cost shocks or rollout delays.",
    signalStrength: 0.91,
    relatedEntities: ["NVIDIA", "Oracle", "MongoDB", "OpenAI"],
    agentNote:
      "Interpreter notes 47% surge in procurement chatter. Narrator: 'Expect margin compression for AI-dependent SaaS by mid-2025.'",
  },
  {
    topic: "Mexico Trucking Strike",
    mentions: 98000,
    momentum: +14,
    riskVector: "Social / Infrastructure",
    riskScore: 0.74,
    narrative:
      "Drivers in Sonora and Jalisco block key supply routes over fuel subsidies — potential disruption to World Cup 2026 logistics corridors.",
    signalStrength: 0.83,
    relatedEntities: ["FedEx", "USMCA", "Jalisco Infrastructure Authority"],
    agentNote:
      "Connector: mapping supply chain reroutes • Watchtower: flagging 5-day disruption risk.",
  },
  {
    topic: "Lululemon Inventory Drop",
    mentions: 112000,
    momentum: +18,
    riskVector: "Retail / ESG",
    riskScore: 0.68,
    narrative:
      "Lululemon reports rising logistics costs and slower restock cadence. AI-driven product recommendations underperform — possible data architecture bottleneck.",
    signalStrength: 0.81,
    relatedEntities: ["Lululemon", "Nike", "MongoDB", "AWS"],
    agentNote:
      "Narrator: 'Retail FOMO loop broken — no post-purchase trigger. CTO hiring signal absent in job postings.'",
  },
  {
    topic: "Balama Mine Force Majeure",
    mentions: 54000,
    momentum: +9,
    riskVector: "Commodities / ESG",
    riskScore: 0.84,
    narrative:
      "Syrah Resources declares force majeure on graphite shipments from Mozambique due to security risks. Potential 3% global EV battery output impact.",
    signalStrength: 0.89,
    relatedEntities: ["Syrah Resources", "Tesla", "Panasonic", "Rio Tinto"],
    agentNote:
      "Scout: detecting reinsurance exposure • Interpreter: correlating with AFRICOM reports • Narrator: 'Graphite risk premium rising.'",
  },
  {
    topic: "Japan Yen Volatility",
    mentions: 251000,
    momentum: -5,
    riskVector: "Macro / FX",
    riskScore: 0.56,
    narrative:
      "Yen swings to 155/USD after new PM hints at export rebalancing. Risk: capital flight and FX mismatches in carry trades.",
    signalStrength: 0.77,
    relatedEntities: ["BOJ", "Toyota", "Panasonic", "Lithium Americas"],
    agentNote:
      "Connector: correlating FX hedges to commodity exporters • Narrator: monitoring Peso-Yen carry pair chatter on X.",
  },
];

