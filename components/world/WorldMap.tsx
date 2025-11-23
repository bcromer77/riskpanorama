
"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, Search, Filter } from "lucide-react";

type RiskCategory =
  | "FPIC"
  | "Political"
  | "Security"
  | "Environmental"
  | "Water"
  | "Social"
  | "Shipping"
  | "Regulatory";

type Mineral =
  | "Lithium"
  | "Cobalt"
  | "Nickel"
  | "Graphite"
  | "Manganese"
  | "Copper"
  | "Bauxite"
  | "Phosphate"
  | "Rare Earths"
  | "Other";

type Regulation =
  | "BatteryPassport"
  | "IRA"
  | "LkSG"
  | "CSDDD"
  | "ModernSlavery"
  | "CBAM"
  | "OtherEU"
  | "Other";

interface Hotspot {
  id: string;
  title: string;
  region: string;
  country?: string;
  coordinates: [number, number];
  category: RiskCategory;
  mineral: Mineral;
  regulations: Regulation[];
  legitimacyIndex: number;
  signal: string;
  dueDiligenceNote: string;
}

const categoryOptions: { id: RiskCategory | "All"; label: string }[] = [
  { id: "All", label: "All signals" },
  { id: "FPIC", label: "FPIC / Indigenous" },
  { id: "Political", label: "Political / Governance" },
  { id: "Security", label: "Security" },
  { id: "Environmental", label: "Environmental" },
  { id: "Water", label: "Water & Climate" },
  { id: "Social", label: "Social & Labour" },
  { id: "Shipping", label: "Shipping / Infrastructure" },
  { id: "Regulatory", label: "Regulatory / Permitting" },
];

const mineralOptions: (Mineral | "All")[] = [
  "All",
  "Lithium",
  "Cobalt",
  "Nickel",
  "Graphite",
  "Manganese",
  "Copper",
  "Bauxite",
  "Phosphate",
  "Rare Earths",
  "Other",
];

const regulationOptions: { id: Regulation | "All"; label: string }[] = [
  { id: "All", label: "All frameworks" },
  { id: "BatteryPassport", label: "EU Battery Passport" },
  { id: "IRA", label: "US IRA" },
  { id: "LkSG", label: "German LkSG" },
  { id: "CSDDD", label: "EU CSDDD" },
  { id: "ModernSlavery", label: "Modern Slavery" },
  { id: "CBAM", label: "EU CBAM / Carbon" },
  { id: "OtherEU", label: "Other EU" },
  { id: "Other", label: "Other regimes" },
];

const hotspots: Hotspot[] = [
  // --- COP30 — THE GLOBAL SYSTEMIC TRIGGER ---
  {
    id: "cop30-global",
    title: "COP30 Global Climate Governance Outcome",
    region: "Belém, Brazil (Global Impact)",
    country: "International",
    coordinates: [-48.5, -1.45],
    category: "Political",
    mineral: "Other",
    regulations: ["BatteryPassport", "CBAM", "CSDDD", "OtherEU"],
    legitimacyIndex: 22,
    signal:
      "COP30 (November 2025) negotiations on climate finance ($310B+ annual adaptation gap), fossil fuel phase-out, and NDC ambition are expected to influence regulatory pressure on water use, Indigenous rights, and carbon intensity in mineral supply chains. Weak outcomes may accelerate scrutiny under EU CSDDD and battery passport environmental/social standards.",
    dueDiligenceNote:
      "Monitoring of COP30 decisions, updated NDCs (due 2025–2026), and resulting national policies on water, land use, and Indigenous consultation is recommended for forward-looking compliance with EU battery passport, CSDDD, and CBAM requirements.",
  },

  // --- BOLIVIA 2025 ELECTIONS — FPIC & PASSPORT RISK ---
  {
    id: "bol-uyuni-elections-2025",
    title: "Bolivia Lithium Elections & FPIC Risk (2025)",
    region: "Salar de Uyuni / Potosí, Bolivia",
    country: "Bolivia",
    coordinates: [-67.5, -20.0],
    category: "Political",
    mineral: "Lithium",
    regulations: ["BatteryPassport", "LkSG", "CSDDD"],
    legitimacyIndex: 27,
    signal:
      "Bolivia's 2025 presidential election (first round August 17, runoff October) has amplified longstanding concerns around Indigenous consultation (FPIC) and regulatory opacity for lithium projects. Public reporting indicates that 53 Indigenous communities in Nor Lípez rejected 2025 state contracts with China's CBC and Russia's Uranium One, citing lack of consultation under ILO 169 and Bolivia's Constitution (Article 30). Allegations of suppressed Indigenous voter turnout and electoral irregularities have been reported. Post-election policy shifts—whether toward nationalization or privatization—could retroactively affect contract validity, export documentation, and FPIC compliance, with direct implications for EU Battery Regulation Article 77 (verifiable provenance and social standards) and German LkSG human-rights due diligence.",
    dueDiligenceNote:
      "Independent FPIC verification aligned with ILO 169, engagement with affected Indigenous organizations (e.g., CUPCONL in Nor Lípez), and scenario planning for post-election policy changes are recommended. Documented consultation records, community-benefit agreements, and grievance-mechanism data are material for EU battery passport Article 77 compliance, LkSG §3(2) FPIC requirements, and Australian Modern Slavery Act disclosures. Diversification to FTA-compliant jurisdictions (Chile, Australia) may reduce exposure to electoral and regulatory volatility.",
  },

  // --- DRC Cobalt & Governance Cluster ---
  {
    id: "drc-m23-rubaya",
    title: "Rubaya Coltan & Cobalt ASM Cluster",
    region: "North Kivu, DRC",
    country: "Democratic Republic of Congo",
    coordinates: [28.5, -1.0],
    category: "Security",
    mineral: "Cobalt",
    regulations: ["BatteryPassport", "LkSG", "ModernSlavery", "CSDDD"],
    legitimacyIndex: 15,
    signal:
      "Public UN and NGO reporting highlights that parts of the artisanal mineral economy in this region have been affected by non-state armed actors, with associated labour-rights, security and governance risks.",
    dueDiligenceNote:
      "OECD-aligned risk assessment, chain-of-custody checks and clear disengagement criteria are typically expected to support EU battery passport data, German LkSG implementation and modern slavery statements.",
  },
  {
    id: "drc-kolwezi",
    title: "Kolwezi Copper–Cobalt Hub",
    region: "Lualaba, DRC",
    country: "Democratic Republic of Congo",
    coordinates: [25.5, -10.7],
    category: "Political",
    mineral: "Cobalt",
    regulations: ["BatteryPassport", "LkSG", "CSDDD"],
    legitimacyIndex: 28,
    signal:
      "Export-quota discussions, regulatory changes and governance concerns in this copper–cobalt district create sensitivity around production stability and documentation quality.",
    dueDiligenceNote:
      "Third-party site audits, verifiable production and export data and documented remediation measures can strengthen disclosures for EU battery passport, LkSG and CSDDD reporting.",
  },
  {
    id: "drc-goma",
    title: "Goma Logistics Corridor",
    region: "North Kivu, DRC",
    country: "Democratic Republic of Congo",
    coordinates: [29.2, -1.7],
    category: "Security",
    mineral: "Cobalt",
    regulations: ["BatteryPassport", "LkSG"],
    legitimacyIndex: 12,
    signal:
      "Periods of conflict and localised road closures have disrupted truck movements and community life around this key logistics corridor.",
    dueDiligenceNote:
      "Route-mapping, security-of-supply planning and documentation of mitigation arrangements are relevant for logistics fields in digital battery passports.",
  },
  {
    id: "drc-lobito-corridor",
    title: "Lobito Atlantic Rail Corridor",
    region: "DRC–Zambia–Angola",
    country: "Regional",
    coordinates: [13.2, -12.3],
    category: "Shipping",
    mineral: "Copper",
    regulations: ["BatteryPassport", "CBAM", "OtherEU"],
    legitimacyIndex: 45,
    signal:
      "Strategic rail and port investments aim to move copper and cobalt concentrate to Atlantic ports, but face implementation, finance and security-of-infrastructure uncertainties.",
    dueDiligenceNote:
      "Monitoring corridor capacity, ESG standards and carbon intensity is important for EU battery passport routing data and future CBAM-linked assessments.",
  },

  // --- Mexico Lithium & Ports Cluster ---
  {
    id: "mex-mazatlan",
    title: "Mazatlán Pacific Port Interface",
    region: "Sinaloa, Mexico",
    country: "Mexico",
    coordinates: [-106.4, 23.2],
    category: "Security",
    mineral: "Lithium",
    regulations: ["BatteryPassport", "IRA", "LkSG"],
    legitimacyIndex: 15,
    signal:
      "Security assessments reference organised-crime influence in the wider region, with potential implications for logistics, insurance and routing choices for lithium-bearing cargo.",
    dueDiligenceNote:
      "Port-specific risk mapping, diversified routes and contractual allocation of delay and security risk can be referenced in IRA supply-chain mapping and EU passport disclosures.",
  },
  {
    id: "mex-manzanillo",
    title: "Manzanillo Pacific Gateway",
    region: "Colima, Mexico",
    country: "Mexico",
    coordinates: [-104.3, 19.1],
    category: "Shipping",
    mineral: "Lithium",
    regulations: ["BatteryPassport", "IRA"],
    legitimacyIndex: 12,
    signal:
      "One of Mexico's principal container hubs, periodically affected by congestion and security alerts, with knock-on effects for transit times.",
    dueDiligenceNote:
      "Documented contingency plans, buffer stock and alternative port options are relevant when describing logistics resilience in battery passport and IRA documentation.",
  },
  {
    id: "mex-sonora",
    title: "Sonora Lithium Belt",
    region: "Sonora, Mexico",
    country: "Mexico",
    coordinates: [-110.9, 29.1],
    category: "Political",
    mineral: "Lithium",
    regulations: ["BatteryPassport", "IRA", "OtherEU"],
    legitimacyIndex: 20,
    signal:
      "Lithium projects in Sonora are shaped by evolving federal policy, security considerations and expectations from communities regarding benefit-sharing.",
    dueDiligenceNote:
      "Tracking permitting frameworks, state-company roles and local agreements helps underpin upstream traceability claims for EU battery passport and IRA compliance.",
  },
  {
    id: "mex-guaymas-yaqui",
    title: "Guaymas Port & Yaqui Territory",
    region: "Sonora, Mexico",
    country: "Mexico",
    coordinates: [-110.9, 27.9],
    category: "FPIC",
    mineral: "Lithium",
    regulations: ["BatteryPassport", "LkSG", "CSDDD"],
    legitimacyIndex: 33,
    signal:
      "Civil-society sources describe ongoing dialogue and legal processes concerning consultation and consent for port and infrastructure expansion overlapping Indigenous territories.",
    dueDiligenceNote:
      "FPIC-aligned engagement records, benefit-sharing arrangements and grievance-mechanism data are material for LkSG and CSDDD due diligence narratives.",
  },

  // --- Guinea Bauxite & Water Stress ---
  {
    id: "gui-boke",
    title: "Boké Bauxite Plateau",
    region: "Boké, Guinea",
    country: "Guinea",
    coordinates: [-13.9, 10.9],
    category: "Water",
    mineral: "Bauxite",
    regulations: ["BatteryPassport", "LkSG", "CBAM"],
    legitimacyIndex: 15,
    signal:
      "Community testimony and research highlight concerns around erosion, dust and local water-resource impacts around bauxite operations.",
    dueDiligenceNote:
      "Hydrogeological studies, dust-mitigation measures and rehabilitation plans can support environmental-impact sections of battery passports and LkSG reporting.",
  },
  {
    id: "gui-simandou",
    title: "Simandou Rail & Port Corridor",
    region: "Southeastern Guinea",
    country: "Guinea",
    coordinates: [-9.4, 11.0],
    category: "Water",
    mineral: "Bauxite",
    regulations: ["BatteryPassport", "CBAM", "OtherEU"],
    legitimacyIndex: 20,
    signal:
      "Large multi-billion-dollar iron ore and related infrastructure projects raise questions around cumulative water use, biodiversity and land-use change.",
    dueDiligenceNote:
      "Cumulative-impact assessments, water-balance data and biodiversity monitoring should feed into ESG datasets used for battery passport carbon-footprint and environmental indicators.",
  },

  // --- Zambia Copper & Power/Water Stress ---
  {
    id: "zam-kafue",
    title: "Kafue River Industrial Belt",
    region: "Zambia",
    country: "Zambia",
    coordinates: [27.8, -15.4],
    category: "Water",
    mineral: "Copper",
    regulations: ["BatteryPassport", "LkSG", "CBAM"],
    legitimacyIndex: 20,
    signal:
      "Historical incidents of effluent releases and water-quality concerns affecting downstream communities underline the sensitivity of water management in this copper corridor.",
    dueDiligenceNote:
      "Tailings-facility reviews, water-quality monitoring and remediation plans can be referenced in environmental-risk sections of supply-chain due diligence statements.",
  },
  {
    id: "zam-kariba",
    title: "Kariba Hydropower Constraint",
    region: "Zambia–Zimbabwe",
    country: "Regional",
    coordinates: [28.4, -16.5],
    category: "Water",
    mineral: "Copper",
    regulations: ["BatteryPassport", "CBAM"],
    legitimacyIndex: 35,
    signal:
      "Low reservoir levels and hydropower constraints have in the past affected electricity supply to mining operations, influencing production volumes and emissions intensity.",
    dueDiligenceNote:
      "Energy-mix disclosure, contingency-power planning and scenario analysis for drought conditions are relevant to GHG-intensity indicators in EU battery passports and CBAM.",
  },

  // --- Indonesia & Philippines Nickel ---
  {
    id: "idn-morowali",
    title: "Morowali Nickel Industrial Park",
    region: "Central Sulawesi, Indonesia",
    country: "Indonesia",
    coordinates: [121.0, -2.3],
    category: "Environmental",
    mineral: "Nickel",
    regulations: ["BatteryPassport", "IRA", "LkSG"],
    legitimacyIndex: 27,
    signal:
      "Rapid build-out of nickel processing capacity has drawn scrutiny around air quality, worker protection, local livelihoods and emissions intensity.",
    dueDiligenceNote:
      "Site-level ESG metrics (GHG intensity, health and safety, community engagement) are increasingly requested by OEMs seeking IRA and EU-aligned nickel sulfate supply.",
  },
  {
    id: "idn-obi",
    title: "Obi Island HPAL Cluster",
    region: "North Maluku, Indonesia",
    country: "Indonesia",
    coordinates: [127.5, -1.5],
    category: "Water",
    mineral: "Nickel",
    regulations: ["BatteryPassport", "LkSG"],
    legitimacyIndex: 26,
    signal:
      "High-pressure acid leach projects are associated with debates over land conversion, biodiversity and long-term waste storage strategies.",
    dueDiligenceNote:
      "Transparent waste-management policies, closure planning and marine-impact monitoring should be integrated into ESG disclosure packs for EU customers.",
  },
  {
    id: "phl-surigao",
    title: "Surigao del Norte Nickel Belt",
    region: "Mindanao, Philippines",
    country: "Philippines",
    coordinates: [125.5, 9.6],
    category: "Regulatory",
    mineral: "Nickel",
    regulations: ["BatteryPassport", "LkSG"],
    legitimacyIndex: 24,
    signal:
      "Alternating moratoria and permitting decisions reflect environmental and community concerns across this nickel-rich area.",
    dueDiligenceNote:
      "Tracking permit status, enforcement actions and rehabilitation commitments is important for forward-looking EU and German compliance planning.",
  },

  // --- Lithium Triangle ---
  {
    id: "chl-atacama",
    title: "Salar de Atacama Brine Operations",
    region: "Antofagasta, Chile",
    country: "Chile",
    coordinates: [-68.2, -23.5],
    category: "Water",
    mineral: "Lithium",
    regulations: ["BatteryPassport", "CBAM", "LkSG"],
    legitimacyIndex: 38,
    signal:
      "Long-running debates around water balance, Indigenous rights and state-ownership models create a complex operating environment for brine-based lithium.",
    dueDiligenceNote:
      "Transparent water-use metrics, community-benefit arrangements and state-company contract terms are central to EU passport and LkSG disclosure quality.",
  },
  {
    id: "arg-hombre-muerto",
    title: "Salar del Hombre Muerto",
    region: "Catamarca, Argentina",
    country: "Argentina",
    coordinates: [-67.0, -25.0],
    category: "Water",
    mineral: "Lithium",
    regulations: ["BatteryPassport", "LkSG"],
    legitimacyIndex: 30,
    signal:
      "Brine developments intersect with high-altitude ecosystems and pastoralist livelihoods, prompting ongoing social dialogue.",
    dueDiligenceNote:
      "Water-balance studies, socio-economic impact assessments and grievance-mechanism data can support due-diligence reporting to EU and US counterparties.",
  },

  // --- US IRA-Relevant Nodes ---
  {
    id: "usa-thacker-pass",
    title: "Thacker Pass Lithium Project",
    region: "Nevada, United States",
    country: "United States",
    coordinates: [-118.0, 41.7],
    category: "FPIC",
    mineral: "Lithium",
    regulations: ["IRA", "BatteryPassport"],
    legitimacyIndex: 34,
    signal:
      "The project has been the subject of legal challenges and public debate regarding cultural heritage, water use and land disturbance.",
    dueDiligenceNote:
      "Court outcomes, consultation records and environmental-mitigation measures are material when assessing IRA clean-vehicle credit eligibility and EU passport ESG fields.",
  },
  {
    id: "usa-gulf-graphite",
    title: "Gulf Coast Graphite & Anode Projects",
    region: "Texas–Louisiana, United States",
    country: "United States",
    coordinates: [-94.5, 29.5],
    category: "Environmental",
    mineral: "Graphite",
    regulations: ["IRA", "LkSG"],
    legitimacyIndex: 25,
    signal:
      "Emerging natural and synthetic graphite-anode projects intersect with port access, industrial clusters and local environmental-justice discussions.",
    dueDiligenceNote:
      "Air-quality controls, waste-management and community-engagement data are relevant under US environmental-justice scrutiny and German buyer LkSG assessments.",
  },

  // --- EU / German Supply Chain Nodes ---
  {
    id: "deu-lksg-hub",
    title: "German Supply Chain Governance Hub",
    region: "Berlin / Frankfurt, Germany",
    country: "Germany",
    coordinates: [13.4, 52.5],
    category: "Political",
    mineral: "Other",
    regulations: ["LkSG", "CSDDD"],
    legitimacyIndex: 40,
    signal:
      "The German Supply Chain Due Diligence Act requires in-scope companies to implement and document human-rights and environmental due diligence across global supply chains.",
    dueDiligenceNote:
      "Central risk-mapping, grievance mechanisms and remediation processes must be demonstrable; this map highlights upstream nodes where enhanced attention may be required for LkSG and CSDDD alignment.",
  },
  {
    id: "hun-debrecen",
    title: "Central/Eastern European Battery Hub",
    region: "Debrecen, Hungary",
    country: "Hungary",
    coordinates: [21.6, 47.5],
    category: "Water",
    mineral: "Other",
    regulations: ["BatteryPassport", "LkSG"],
    legitimacyIndex: 24,
    signal:
      "Large cell-manufacturing investments have prompted attention around water use, local environmental standards and community engagement.",
    dueDiligenceNote:
      "Water-use transparency and impact studies should feed into corporate risk assessments under EU and German supply chain rules.",
  },

  // --- Australia Critical Minerals & Modern Slavery ---
  {
    id: "aus-pilbara",
    title: "Pilbara Spodumene Corridor",
    region: "Western Australia, Australia",
    country: "Australia",
    coordinates: [118.0, -22.0],
    category: "Water",
    mineral: "Lithium",
    regulations: ["ModernSlavery", "BatteryPassport"],
    legitimacyIndex: 26,
    signal:
      "High-volume hard-rock lithium exports rely on fly-in-fly-out workforces, long-distance logistics and arid environments.",
    dueDiligenceNote:
      "Workforce conditions, Indigenous engagement and water-use data are material for Australian Modern Slavery Act statements and EU supply-chain reviews.",
  },
  {
    id: "aus-greenbushes",
    title: "Greenbushes Lithium Operations",
    region: "Western Australia, Australia",
    country: "Australia",
    coordinates: [116.1, -33.9],
    category: "Environmental",
    mineral: "Lithium",
    regulations: ["BatteryPassport", "LkSG"],
    legitimacyIndex: 18,
    signal:
      "One of the world's largest hard-rock lithium mines, subject to rigorous safety and environmental oversight.",
    dueDiligenceNote:
      "Transparent disclosure of emissions, tailings management and community relations can support lower-risk scoring under LkSG and modern slavery frameworks.",
  },

  // --- China REE / Graphite & Export Controls ---
  {
    id: "chn-ree-governance",
    title: "China Rare Earth Export Governance",
    region: "China",
    country: "China",
    coordinates: [104.0, 35.0],
    category: "Political",
    mineral: "Rare Earths",
    regulations: ["BatteryPassport", "IRA", "OtherEU"],
    legitimacyIndex: 18,
    signal:
      "Adjustments to export licensing and technology controls for certain rare earth products influence availability and pricing for downstream users.",
    dueDiligenceNote:
      "Diversification of rare-earth sourcing, long-term contracts and regulatory monitoring are key inputs to EU battery passport resilience indicators and IRA 'foreign entity of concern' analysis.",
  },
  {
    id: "chn-graphite-heilongjiang",
    title: "Heilongjiang Natural Graphite Belt",
    region: "Northeast China",
    country: "China",
    coordinates: [127.0, 47.0],
    category: "Security",
    mineral: "Graphite",
    regulations: ["BatteryPassport", "IRA"],
    legitimacyIndex: 29,
    signal:
      "Concentration of anode-grade natural graphite and evolving export-policy discussions underline supply-concentration and geopolitical risk.",
    dueDiligenceNote:
      "Scenario analysis for export-policy shifts and development of alternative sources may be required for IRA-eligible anode supply and EU-compliant sourcing.",
  },

  // --- Nordic FPIC / Reindeer / Wind / Mining ---
  {
    id: "nor-sapmi-fpic",
    title: "Sápmi Wind & Mining Overlap",
    region: "Norway–Sweden–Finland",
    country: "Nordic Region",
    coordinates: [18.0, 67.0],
    category: "FPIC",
    mineral: "Nickel",
    regulations: ["BatteryPassport", "LkSG", "CSDDD"],
    legitimacyIndex: 31,
    signal:
      "Projects in traditional Sámi reindeer-herding areas have prompted debate over Indigenous rights, cumulative impacts and the quality of consultation processes.",
    dueDiligenceNote:
      "Independent review of consultation, cultural-heritage protections and mitigation measures can be reflected in LkSG and battery passport ESG sections.",
  },

  // --- Maritime Corridors (Suez / Panama / Malacca) ---
  {
    id: "mar-red-sea",
    title: "Red Sea & Bab el-Mandeb Corridor",
    region: "International Waters",
    country: "Maritime",
    coordinates: [43.0, 16.0],
    category: "Shipping",
    mineral: "Other",
    regulations: ["BatteryPassport", "CBAM"],
    legitimacyIndex: 26,
    signal:
      "Security incidents and rerouting decisions have periodically reduced container traffic, increasing costs and transit times for Asia–Europe trade.",
    dueDiligenceNote:
      "Route diversification, maritime insurance strategies and buffer-stock policies are central to explaining logistics resilience in battery passport narratives.",
  },
  {
    id: "mar-panama",
    title: "Panama Canal Drought Constraint",
    region: "Panama",
    country: "Panama",
    coordinates: [-79.9, 9.1],
    category: "Water",
    mineral: "Other",
    regulations: ["BatteryPassport", "CBAM"],
    legitimacyIndex: 28,
    signal:
      "Low water levels have led to draft restrictions and reduced transits, affecting bulk commodity schedules and freight costs.",
    dueDiligenceNote:
      "Assessment of exposure to canal constraints and alternative routing is relevant to supply-chain risk disclosures and carbon-footprint calculations.",
  },
  {
    id: "mar-malacca",
    title: "Strait of Malacca & Singapore",
    region: "Southeast Asia",
    country: "Regional",
    coordinates: [101.0, 2.5],
    category: "Shipping",
    mineral: "Other",
    regulations: ["BatteryPassport", "OtherEU"],
    legitimacyIndex: 20,
    signal:
      "One of the world's busiest shipping lanes, exposed to congestion, accidents and regional security dynamics that can influence transit times for critical minerals.",
    dueDiligenceNote:
      "Critical-route identification, contingency planning and port diversification should be documented as part of systemic-risk analysis.",
  },

  // --- Deep Sea & Arctic (CCZ, Arctic Seabed, Pacific Islands – FPIC & Governance) ---
  {
    id: "ds-clarion-clipperton",
    title: "Clarion-Clipperton Zone (CCZ)",
    region: "Central Pacific Ocean",
    country: "International Seabed Area",
    coordinates: [-155.0, 10.0],
    category: "Environmental",
    mineral: "Manganese",
    regulations: ["BatteryPassport", "OtherEU", "CBAM"],
    legitimacyIndex: 32,
    signal:
      "Polymetallic nodule exploration in the CCZ raises questions around deep-sea biodiversity, long-term ecosystem impacts and governance under the International Seabed Authority.",
    dueDiligenceNote:
      "Companies considering exposure to deep-sea minerals may need to transparently describe environmental-risk assessments, stakeholder expectations and policy scenarios when disclosing to EU and global investors.",
  },
  {
    id: "ds-arctic-seabed",
    title: "Arctic Seabed Exploration & Coastal FPIC",
    region: "Greenland / Arctic Shelf",
    country: "Arctic Region",
    coordinates: [-30.0, 72.0],
    category: "FPIC",
    mineral: "Rare Earths",
    regulations: ["BatteryPassport", "LkSG", "CSDDD"],
    legitimacyIndex: 30,
    signal:
      "Discussions around seabed exploration and coastal mining in Arctic waters intersect with Indigenous rights, fishing livelihoods and sensitive polar ecosystems.",
    dueDiligenceNote:
      "Alignment with FPIC expectations, climate-risk assessments and coastal-community engagement will be central for any future Arctic-linked supply claims in EU and German reporting.",
  },
  {
    id: "pac-island-ocean-states",
    title: "Pacific Island Ocean States – Deep-Sea Governance",
    region: "Micronesia / Polynesia",
    country: "Pacific Island States",
    coordinates: [170.0, -10.0],
    category: "FPIC",
    mineral: "Manganese",
    regulations: ["BatteryPassport", "OtherEU"],
    legitimacyIndex: 29,
    signal:
      "Pacific Island states and communities have expressed strong views on participation, consent and benefit-sharing in relation to potential deep-sea mining in adjacent waters.",
    dueDiligenceNote:
      "For any future nodules-related supply, robust engagement records with coastal states and regional bodies would be expected to support FPIC-aligned, climate-aware due diligence.",
  },

  // --- Mozambique Graphite ---
  {
    id: "moz-cabo-delgado-graphite",
    title: "Cabo Delgado Graphite Province",
    region: "Balama–Montepuez, Mozambique",
    country: "Mozambique",
    coordinates: [38.2, -13.0],
    category: "Security",
    mineral: "Graphite",
    regulations: ["BatteryPassport", "IRA", "LkSG", "ModernSlavery"],
    legitimacyIndex: 27,
    signal:
      "Large flake-graphite operations intersect with evolving security dynamics and community expectations over benefit-sharing in northern Mozambique.",
    dueDiligenceNote:
      "Third-party security-risk assessments, community-benefit agreements and verification of tailings and water management support IRA 'foreign entity of concern' screening and EU battery-passport traceability.",
  },
  {
    id: "moz-nacala-corridor",
    title: "Nacala Graphite Export Corridor",
    region: "Northern Mozambique",
    country: "Mozambique",
    coordinates: [40.7, -14.5],
    category: "Shipping",
    mineral: "Graphite",
    regulations: ["BatteryPassport", "LkSG"],
    legitimacyIndex: 22,
    signal:
      "Graphite concentrate travels long distances by truck and rail to Nacala port; episodic insecurity and infrastructure bottlenecks create cost and lead-time volatility.",
    dueDiligenceNote:
      "Route-security audits, alternative rail assessments and maritime insurance clauses should be documented in supply-chain contracts for German LkSG and EU reporting.",
  },

  // --- Moroccan Phosphates (incl. Western Sahara) ---
  {
    id: "mor-ocp-khouribga",
    title: "Khouribga Phosphate Basin",
    region: "Chaouia-Ouardigha, Morocco",
    country: "Morocco",
    coordinates: [-6.9, 32.9],
    category: "Water",
    mineral: "Phosphate",
    regulations: ["BatteryPassport", "CBAM", "OtherEU"],
    legitimacyIndex: 24,
    signal:
      "Integrated mining–chemical complexes supplying battery-grade purified phosphoric acid operate in a context of water stress and rising GHG-intensity scrutiny.",
    dueDiligenceNote:
      "Disclosure of desalination capacity, recycled-water use and Scope 1+2 emissions improves alignment with EU battery-passport carbon-footprint and CBAM expectations.",
  },
  {
    id: "ehs-bou-craa",
    title: "Bou Craa Phosphate Conveyor",
    region: "Western Sahara (disputed)",
    country: "Territory with disputed status",
    coordinates: [-12.8, 27.2],
    category: "FPIC",
    mineral: "Phosphate",
    regulations: ["BatteryPassport", "LkSG", "CSDDD"],
    legitimacyIndex: 34,
    signal:
      "Exports from Bou Craa transit territory listed by the UN as non-self-governing; questions persist around consent and benefit-sharing with local populations.",
    dueDiligenceNote:
      "Pending judicial and diplomatic developments, companies may need FPIC-aligned provenance evidence and human-rights impact assessments to support LkSG and Article 77 battery-passport disclosures.",
  },

  // --- New Caledonia Nickel ---
  {
    id: "ncl-goro-plant",
    title: "Goro HPAL & Prony Resources",
    region: "South Province, New Caledonia",
    country: "New Caledonia (France)",
    coordinates: [166.9, -22.3],
    category: "Water",
    mineral: "Nickel",
    regulations: ["BatteryPassport", "LkSG", "CBAM"],
    legitimacyIndex: 28,
    signal:
      "High-pressure acid leach operations with a legacy of effluent incidents, community protest and sensitivity to political developments around autonomy.",
    dueDiligenceNote:
      "Continuous environmental-compliance monitoring, social-license metrics and power-mix decarbonisation plans support EU low-carbon nickel claims and LkSG risk assessments.",
  },
  {
    id: "ncl-koniambo",
    title: "Koniambo Ferronickel Complex",
    region: "North Province, New Caledonia",
    country: "New Caledonia (France)",
    coordinates: [164.8, -20.9],
    category: "Regulatory",
    mineral: "Nickel",
    regulations: ["BatteryPassport", "CBAM"],
    legitimacyIndex: 23,
    signal:
      "Ferronickel operations rely on subsidised power and face periodic labour and feedstock challenges that influence throughput and emissions intensity.",
    dueDiligenceNote:
      "Power-mix transparency, labour-relations data and contingency-ore sourcing plans enhance risk narratives under EU carbon-intensity and supply-resilience standards.",
  },
  {
    id: "ncl-noumea-port",
    title: "Nouméa Bulk-Nickel Export Port",
    region: "New Caledonia",
    country: "New Caledonia (France)",
    coordinates: [166.4, -22.3],
    category: "Shipping",
    mineral: "Nickel",
    regulations: ["BatteryPassport", "CBAM"],
    legitimacyIndex: 20,
    signal:
      "Port congestion and cyclone-season disruptions can delay laterite and matte shipments to refineries in Asia, affecting lead times and shipping emissions.",
    dueDiligenceNote:
      "Weather-contingency clauses, diversified port options and buffer inventories should be reflected in contractual and passport-level logistics disclosures.",
  },

  // --- South-African Manganese & Logistics ---
  {
    id: "zaf-hotazel",
    title: "Hotazel Manganese Cluster",
    region: "Northern Cape, South Africa",
    country: "South Africa",
    coordinates: [23.0, -27.3],
    category: "Water",
    mineral: "Manganese",
    regulations: ["BatteryPassport", "CBAM", "LkSG"],
    legitimacyIndex: 26,
    signal:
      "High-grade manganese ore district facing rail bottlenecks, community water-supply pressure and tightening dust-emission standards.",
    dueDiligenceNote:
      "Independent logistics-capacity studies and water-use audits underpin EU battery-passport and IRA manganese-content claims and LkSG environmental due diligence.",
  },
  {
    id: "zaf-transnet-rail",
    title: "Transnet Ore Export Line",
    region: "Northern Cape → Eastern Cape, South Africa",
    country: "South Africa",
    coordinates: [25.6, -28.5],
    category: "Shipping",
    mineral: "Manganese",
    regulations: ["BatteryPassport", "CBAM"],
    legitimacyIndex: 30,
    signal:
      "Cable-theft incidents and rolling-stock constraints have reduced rail throughput, shifting volumes to road and raising Scope 3 transport emissions.",
    dueDiligenceNote:
      "GHG-intensity recalculations and alternative-port scenarios should be documented for EU carbon-footprint declarations and systemic risk analysis.",
  },
  {
    id: "zaf-ngqura-port",
    title: "Ngqura Bulk-Manganese Terminal",
    region: "Eastern Cape, South Africa",
    country: "South Africa",
    coordinates: [25.7, -33.8],
    category: "Regulatory",
    mineral: "Manganese",
    regulations: ["BatteryPassport", "LkSG"],
    legitimacyIndex: 24,
    signal:
      "Export-terminal expansion has been affected by environmental-permit processes and community concerns over air quality and dust.",
    dueDiligenceNote:
      "Permit-status monitoring, dust-mitigation technology and community-engagement records should feed LkSG and broader ESG disclosures.",
  },
  {
    id: "zaf-mamatwan-water",
    title: "Mamatwan Mine Water Balance",
    region: "Northern Cape, South Africa",
    country: "South Africa",
    coordinates: [22.9, -27.1],
    category: "Water",
    mineral: "Manganese",
    regulations: ["BatteryPassport", "LkSG", "CBAM"],
    legitimacyIndex: 25,
    signal:
      "Projected rainfall decline and competing water demands raise processing-water scarcity and tailings-seepage risk.",
    dueDiligenceNote:
      "Site-level climate-adaptation plans and independent hydro-monitoring bolster EU battery-passport environmental indicators and German LkSG compliance.",
  },
];

function categoryColor(cat: RiskCategory): string {
  switch (cat) {
    case "FPIC":
      return "from-cyan-400 to-cyan-600";
    case "Political":
      return "from-purple-400 to-purple-600";
    case "Security":
      return "from-rose-400 to-rose-600";
    case "Environmental":
      return "from-emerald-400 to-emerald-600";
    case "Water":
      return "from-sky-400 to-sky-600";
    case "Social":
      return "from-amber-400 to-amber-600";
    case "Shipping":
      return "from-indigo-400 to-indigo-600";
    case "Regulatory":
      return "from-pink-400 to-pink-600";
    default:
      return "from-slate-400 to-slate-600";
  }
}

function categoryLabel(cat: RiskCategory): string {
  const found = categoryOptions.find((c) => c.id === cat);
  return found ? found.label : cat;
}

function regulationLabel(reg: Regulation): string {
  switch (reg) {
    case "BatteryPassport":
      return "EU Battery Passport";
    case "IRA":
      return "US IRA";
    case "LkSG":
      return "German LkSG";
    case "CSDDD":
      return "EU CSDDD";
    case "ModernSlavery":
      return "Modern Slavery Acts";
    case "CBAM":
      return "EU CBAM / Carbon";
    case "OtherEU":
      return "Other EU frameworks";
    case "Other":
      return "Other regimes";
  }
}

export default function WorldMap() {
  const [selected, setSelected] = useState<Hotspot | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<RiskCategory | "All">(
    "All",
  );
  const [mineralFilter, setMineralFilter] = useState<Mineral | "All">("All");
  const [regulationFilter, setRegulationFilter] =
    useState<Regulation | "All">("All");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return hotspots.filter((h) => {
      if (categoryFilter !== "All" && h.category !== categoryFilter) return false;
      if (mineralFilter !== "All" && h.mineral !== mineralFilter) return false;
      if (regulationFilter !== "All" && !h.regulations.includes(regulationFilter))
        return false;
      if (!term) return true;

      const haystack = [
        h.title,
        h.region,
        h.country ?? "",
        h.signal,
        h.mineral,
        categoryLabel(h.category),
        ...h.regulations.map(regulationLabel),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [search, categoryFilter, mineralFilter, regulationFilter]);

  const project = (lng: number, lat: number) => ({
    x: ((lng + 180) / 360) * 100,
    y: ((90 - lat) / 180) * 100,
  });

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden">
      <Image
        src="/world-map-dark.png"
        alt="Global battery supply chain risk map"
        fill
        className="object-cover opacity-80"
        priority
      />

      {/* Top gradient + controls */}
      <div className="absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="max-w-6xl mx-auto px-6 pt-6 pb-4 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300/80">
                Global Signals
              </p>
              <h1 className="text-xl md:text-2xl font-semibold text-white">
                Battery Supply Chain Risk Atlas
              </h1>
              <p className="text-xs md:text-[13px] text-slate-200/90 max-w-2xl mt-1.5">
                High-level, sanitised risk signals across mining, refining, logistics
                and governance nodes — aligned with EU Battery Passport, IRA, German
                LkSG, CSDDD and modern slavery regimes. Use filters to focus by risk
                type, mineral and regulatory lens.
              </p>
            </div>

            {/* Search */}
            <div className="w-full md:w-80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by country, port, mineral, regime…"
                  className="w-full rounded-full bg-black/60 border border-slate-600/70 px-8 py-1.5 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/70 focus:border-cyan-400/70"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                e.g. "lithium port", "FPIC", "DRC cobalt", "Panama canal", "IRA"
              </p>
            </div>
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 border border-slate-600/70 text-slate-200">
              <Filter className="w-3 h-3" />
              Filters
            </span>

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as RiskCategory | "All")
              }
              className="rounded-full bg-black/60 border border-slate-600/70 px-3 py-1 pr-6 text-[11px] text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400/80"
            >
              {categoryOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Mineral */}
            <select
              value={mineralFilter}
              onChange={(e) =>
                setMineralFilter(e.target.value as Mineral | "All")
              }
              className="rounded-full bg-black/60 border border-slate-600/70 px-3 py-1 pr-6 text-[11px] text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400/80"
            >
              {mineralOptions.map((m) => (
                <option key={m} value={m}>
                  {m === "All" ? "All minerals" : m}
                </option>
              ))}
            </select>

            {/* Regulation */}
            <select
              value={regulationFilter}
              onChange={(e) =>
                setRegulationFilter(e.target.value as Regulation | "All")
              }
              className="rounded-full bg-black/60 border border-slate-600/70 px-3 py-1 pr-6 text-[11px] text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400/80"
            >
              {regulationOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>

            <span className="ml-auto text-[10px] text-slate-400">
              Showing{" "}
              <span className="text-cyan-300 font-semibold">
                {filtered.length}
              </span>{" "}
              of {hotspots.length} locations
            </span>
          </div>
        </div>
      </div>

      {/* Markers */}
      <div className="absolute inset-0 z-10">
        {filtered.map((spot) => {
          const { x, y } = project(spot.coordinates[0], spot.coordinates[1]);
          const gradient = categoryColor(spot.category);

          return (
            <button
              key={spot.id}
              className="absolute z-20 group"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
              }}
              onClick={() => setSelected(spot)}
            >
              {/* soft glow */}
              <motion.div
                className={`absolute -inset-6 rounded-full bg-gradient-to-br ${gradient} opacity-25 blur-3xl`}
                animate={{ opacity: [0.12, 0.35, 0.12] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              {/* core marker */}
              <div
                className={`relative w-7 h-7 rounded-full bg-gradient-to-br ${gradient} shadow-lg ring-2 ring-white/40 group-hover:ring-cyan-300/80 group-hover:scale-110 transition-transform`}
              >
                <div className="absolute inset-1 rounded-full bg-black/80 flex items-center justify-center">
                  <span className="text-[11px] font-semibold text-white">
                    {spot.legitimacyIndex}
                  </span>
                </div>
              </div>
              {/* label on hover */}
              <div className="absolute left-1/2 top-9 -translate-x-1/2 px-2 py-1 rounded-md bg-black/80 border border-slate-700/80 text-[10px] text-slate-100 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                {spot.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="absolute left-4 bottom-4 z-20 bg-black/75 border border-slate-700/80 rounded-2xl px-3 py-2 text-[10px] text-slate-200 max-w-xs backdrop-blur">
        <p className="font-semibold text-[11px] text-slate-100 mb-1">
          Legend
        </p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {(
            [
              "FPIC",
              "Political",
              "Security",
              "Environmental",
              "Water",
              "Social",
              "Shipping",
              "Regulatory",
            ] as RiskCategory[]
          ).map((cat) => (
            <div key={cat} className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full bg-gradient-to-br ${categoryColor(
                  cat,
                )}`}
              />
              <span className="truncate">{categoryLabel(cat)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selected && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="absolute inset-y-0 right-0 w-full max-w-md bg-black/95 backdrop-blur-xl z-40 border-l border-slate-800 flex flex-col"
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-5 right-5 text-slate-300 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-6 pt-12 space-y-6 overflow-y-auto">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  {categoryLabel(selected.category)}
                </p>
                <h2 className="text-xl font-semibold text-white leading-tight">
                  {selected.title}
                </h2>
                <p className="text-sm text-cyan-300">{selected.region}</p>
                {selected.country && (
                  <p className="text-[11px] text-slate-400">
                    {selected.country}
                  </p>
                )}
              </div>

              {/* Chips */}
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <span className="px-2 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-200">
                  Mineral: {selected.mineral}
                </span>
                {selected.regulations.map((reg) => (
                  <span
                    key={reg}
                    className="px-2 py-1 rounded-full bg-slate-800 border border-slate-600 text-slate-100"
                  >
                    {regulationLabel(reg)}
                  </span>
                ))}
              </div>

              {/* Signal */}
              <div className="text-sm text-slate-100 space-y-3">
                <p className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <span>{selected.signal}</span>
                </p>
              </div>

              {/* Legitimacy Index */}
              <div className="bg-gradient-to-br from-slate-900 to-black border border-slate-700/80 rounded-2xl p-4 text-center">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-300">
                  Legitimacy Index
                </p>
                <p className="text-4xl font-black mt-1 text-cyan-300">
                  {selected.legitimacyIndex}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Higher scores indicate greater public-reporting density and
                  governance relevance — not a legal conclusion.
                </p>
              </div>

              {/* Due diligence note */}
              <div className="text-[11px] text-slate-300 leading-relaxed">
                {selected.dueDiligenceNote}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Disclaimer */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 max-w-4xl px-4 text-center">
        <p className="text-[10px] text-slate-400 bg-black/70 border border-slate-700/70 rounded-full px-4 py-2 inline-block backdrop-blur">
          Illustrative, high-level risk signals based on public reporting and analyst
          assessments. This map does not allege unlawful conduct by any specific actor
          and does not constitute legal, tax or investment advice. Companies remain
          responsible for independent due diligence and legal analysis, including for
          compliance with EU battery passport rules, US IRA provisions, the German
          Supply Chain Due Diligence Act, CSDDD, modern slavery legislation and other
          applicable regulations.
        </p>
      </div>
    </div>
  );
}
