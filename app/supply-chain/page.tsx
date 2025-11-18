// app/supply-chain/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Radio,
  Globe,
  Scale,
  X,
  AlertOctagon,
  ChevronRight,
  TrendingUp,
  MapPin,
} from "lucide-react";
import WorldMap, { MapMarker } from "@/components/world/WorldMap";

// -------------------------------
// Types
// -------------------------------
type SupplierPassport = {
  id: string;
  supplier: string;
  country: string;
  fpicScore: number;
  esgScore: number;
  politicalScore: number;
  passportUrl?: string;
};

type GlobalSignal = {
  title: string;
  category:
    | "Geopolitical"
    | "Political"
    | "Regulatory Horizon"
    | "Indigenous Rights"
    | "Environmental";
  country: string;
  severity: "low" | "medium" | "high";
  description: string;
  source?: string;
  forecastHorizon?: string;
};

type IndigenousBroadcast = {
  station: string;
  region: string;
  language: string;
  severity: "low" | "medium" | "high";
  excerpt: string;
  timestamp: string;
};

// -------------------------------
// Enhanced Severity Badge with animation
// -------------------------------
const severityBadge = (level: "low" | "medium" | "high") => {
  const map: Record<typeof level, string> = {
    high: "bg-rose-100 text-rose-800 border-rose-300 animate-pulse",
    medium: "bg-amber-100 text-amber-800 border-amber-300",
    low: "bg-emerald-100 text-emerald-800 border-emerald-300",
  };

  const colors = map[level];
  const label =
    level === "high" ? "High Risk" : level === "medium" ? "Medium Risk" : "Low Risk";

  return (
    <Badge className={`${colors} text-[10px] border font-medium flex items-center gap-1`}>
      {label}
    </Badge>
  );
};

const horizonBadge = () => (
  <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 text-[10px] border font-medium flex items-center gap-1">
    <AlertOctagon className="w-3 h-3" />
    Horizon Risk
  </Badge>
);

const scoreTag = (label: string, score: number) => {
  const bg =
    score >= 0.7
      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
      : score >= 0.4
      ? "bg-amber-100 text-amber-800 border-amber-300"
      : "bg-rose-100 text-rose-800 border-rose-300";

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${bg}`}>
      {label}: {(score * 100).toFixed(0)}%
    </span>
  );
};

const overallScore = (p: SupplierPassport) =>
  (p.fpicScore + p.esgScore + p.politicalScore) / 3;

const overallLabel = (score: number) =>
  score >= 0.7 ? "Ready" : score >= 0.4 ? "Needs Review" : "High Concern";

// -------------------------------
// Country Code Resolver
// -------------------------------
function countryCodeFromName(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes("mozambique")) return "MZ";
  if (n.includes("mexico")) return "MX";
  if (n.includes("drc") || n.includes("congo")) return "CD";
  if (n.includes("sweden") || n.includes("skellefte")) return "SE";
  if (n.includes("canada") || n.includes("yukon")) return "CA";
  if (n.includes("brazil") || n.includes("acre")) return "BR";
  if (n.includes("china")) return "CN";
  if (n.includes("india") || n.includes("telangana")) return "IN";
  if (n.includes("indonesia")) return "ID";
  if (n.includes("mali") || n.includes("sahel")) return "ML";
  if (n.includes("pakistan") || n.includes("balochistan")) return "PK";
  if (n.includes("namibia")) return "NA";
  if (n.includes("argentina")) return "AR";
  if (n.includes("myanmar") || n.includes("burma")) return "MM";
  if (n.includes("european union") || n.includes("eu")) return "EU";
  return null;
}

function intensityFromScore(score: number): "low" | "medium" | "high" {
  if (score >= 0.7) return "low";
  if (score >= 0.4) return "medium";
  return "high";
}

// -------------------------------
// Corridor data for breakdown card
// -------------------------------
const CORRIDOR_DATA: Record<
  string,
  {
    name: string;
    routes: string[];
    threats: string[];
    fpicRisk: "low" | "medium" | "high";
  }
> = {
  CD: {
    name: "DRC Cobalt Corridor",
    routes: ["Kolwezi → Zambia → Durban", "Kolwezi → Tanzania → Dar es Salaam"],
    threats: ["M23 rebel control", "Road blockades", "Export license delays"],
    fpicRisk: "high",
  },
  CN: {
    name: "China REE Export Routes",
    routes: ["Inner Mongolia → Tianjin Port", "Sichuan → Shanghai Port"],
    threats: ["Export license regime", "Geopolitical retaliation", "Quota restrictions"],
    fpicRisk: "low",
  },
  IN: {
    name: "India Graphite Belt",
    routes: ["Telangana → Chennai Port", "Odisha → Visakhapatnam"],
    threats: ["Election-driven mine shutdowns", "State-level policy shifts"],
    fpicRisk: "medium",
  },
  CA: {
    name: "Yukon Critical Minerals Corridor",
    routes: ["Yukon → Alaska refineries", "Yukon → Vancouver Port"],
    threats: ["First Nations injunctions", "FPIC consultation failures", "Court delays"],
    fpicRisk: "high",
  },
  MX: {
    name: "Mexico Lithium Triangle",
    routes: ["Sonora → US border", "Baja California → Pacific ports"],
    threats: ["Nationalization", "Concession cancellations", "Policy reversals"],
    fpicRisk: "medium",
  },
  BR: {
    name: "Amazon Grid Expansion",
    routes: ["Acre → Bolivia border", "Rondônia → Santos Port"],
    threats: [
      "Indigenous veto threats",
      "Federal prosecutor challenges",
      "Uncontacted territories",
    ],
    fpicRisk: "high",
  },
  MM: {
    name: "Myanmar REE Feedstock",
    routes: ["Kachin State → Yunnan, China"],
    threats: ["Civil war", "Insurgent mine control", "Supply disruption"],
    fpicRisk: "high",
  },
  NA: {
    name: "Namibia Uranium/Lithium Belt",
    routes: ["Erongo → Walvis Bay Port"],
    threats: ["Indigenous veto bill (2026)", "Traditional authority challenges"],
    fpicRisk: "medium",
  },
};

// -------------------------------
// Main Component
// -------------------------------
export default function SupplyChainPage() {
  const router = useRouter();

  const [passports, setPassports] = useState<SupplierPassport[]>([]);
  const [signals, setSignals] = useState<GlobalSignal[]>([]);
  const [broadcasts, setBroadcasts] = useState<IndigenousBroadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [fpicSidebarOpen, setFpicSidebarOpen] = useState(false);
  const [corridorCardOpen, setCorridorCardOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/passport?all=true", { cache: "no-store" });
        const data = await res.json();
        setPassports(data.passports || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }

      setSignals([
        {
          title: "China REE Export License Regime Goes Live Dec 1",
          category: "Geopolitical",
          country: "China",
          severity: "high",
          description:
            "Any product with >0.1% Chinese rare earths now requires Beijing re-export license. Analysts: 'This is the nuclear option.' 6.2M EVs, 650 AI data centers at risk.",
          source: "X • Reuters • FT",
        },
        {
          title: "M23 Rebels Cut DRC Cobalt Corridor to Zambia",
          category: "Geopolitical",
          country: "DRC",
          severity: "high",
          description:
            "M23 controls key highway from Kolwezi to Zambian border. Cobalt shipments halted. EU battery passport routes via DRC now at direct risk of invalidation.",
          source: "Reuters • X battlefield reports",
        },
        {
          title: "Telangana Opposition Vows to Shut All Mines if Elected 2028",
          category: "Political",
          country: "India",
          severity: "high",
          description:
            "BRS party manifesto: 'No new mines, existing ones phased out.' Telangana hosts ~40% of India's graphite & lithium exploration. Direct threat to domestic EV supply.",
          source: "X posts from party leaders • The Hindu",
        },
        {
          title: "Mexico Lithium Nationalization Expands Under New President",
          category: "Political",
          country: "Mexico",
          severity: "high",
          description:
            "Sheinbaum administration extends AMLO's lithium monopoly. All private concessions under review. EU/US cathode contracts face renegotiation or cancellation risk.",
          source: "Bloomberg • X",
        },
        {
          title: "Yukon First Nations File Injunction on Critical Minerals Road",
          category: "Indigenous Rights",
          country: "Canada",
          severity: "high",
          description:
            "Kaska Dena Council seeks court order halting construction. Claims inadequate FPIC. Route critical for nickel/cobalt to Alaska refineries.",
          source: "CBC • Indigenous radio",
        },
        {
          title: "Brazil Amazon Grid Expansion Faces Indigenous Veto Threat",
          category: "Indigenous Rights",
          country: "Brazil",
          severity: "medium",
          description:
            "Acre transmission lines cross uncontacted territories. Federal prosecutors warn project violates FPIC under ILO 169. Could delay lithium transport from Bolivia border.",
          source: "Folha • Amazonia radio",
        },
        {
          title: "Namibia Drafts Indigenous Veto on Critical Mineral Licenses",
          category: "Regulatory Horizon",
          country: "Namibia",
          severity: "medium",
          description:
            "Bill gives traditional authorities binding veto on uranium/lithium permits. Expected Q4 2026. Pattern matches Zimbabwe 2024 lithium law.",
          source: "Draft seen by Reuters Africa • local radio",
          forecastHorizon: "2026–2027",
        },
        {
          title: "Argentina 2030 Lithium Export Tax Escalation Bill",
          category: "Regulatory Horizon",
          country: "Argentina",
          severity: "medium",
          description:
            "Sliding-scale tax 15→60% on raw lithium if no local refining by 2030. Targets EU/US cathode contracts. Bill circulating in Congress.",
          source: "Argentine mining ministry leak • X",
          forecastHorizon: "2028–2030",
        },
        {
          title: "Myanmar Civil War Cuts China's REE Feedstock",
          category: "Geopolitical",
          country: "Myanmar",
          severity: "high",
          description:
            "Kachin insurgents control 90% of heavy rare earth mines. China's southern refining hubs now running at 60% capacity.",
          source: "Reuters • X battlefield reports",
        },
        {
          title: "Sahel Juntas Nationalize Uranium Mines",
          category: "Political",
          country: "Mali",
          severity: "high",
          description:
            "Western firms expelled. Niger, Burkina Faso follow. EU nuclear + battery supply under direct threat.",
          source: "FT • Reuters",
        },
        {
          title: "FPIC grievance filed — Balama graphite",
          category: "Indigenous Rights",
          country: "Mozambique",
          severity: "high",
          description:
            "Community elders report consultations bypassed during mine expansion. Could trigger EU Battery Passport FPIC audit failure.",
        },
      ]);

      setBroadcasts([
        {
          station: "Radio Balama Voices",
          region: "Cabo Delgado, Mozambique",
          language: "Makua / Portuguese",
          severity: "high",
          excerpt: "Community elders report consultations bypassed during mine expansion.",
          timestamp: "12 min ago",
        },
        {
          station: "Kaska Dena Radio",
          region: "Yukon, Canada",
          language: "Kaska / English",
          severity: "high",
          excerpt: "Injunction filed. Road construction must stop until proper FPIC obtained.",
          timestamp: "1 hr ago",
        },
        {
          station: "Amazonia Pueblos Radio",
          region: "Acre, Brazil",
          language: "Portuguese / Asháninka",
          severity: "medium",
          excerpt: "Federal prosecutors say transmission lines violate uncontacted peoples' rights.",
          timestamp: "3 hrs ago",
        },
        {
          station: "Baloch Voices FM",
          region: "Balochistan, Pakistan",
          language: "Balochi / Urdu",
          severity: "high",
          excerpt: "Insurgent attacks on Chinese mining convoys escalate.",
          timestamp: "2 hrs ago",
        },
        {
          station: "Kachin Independence Radio",
          region: "Kachin State, Myanmar",
          language: "Jinghpaw",
          severity: "high",
          excerpt: "Mining roads blocked. No REE leaving rebel-held zones.",
          timestamp: "4 hrs ago",
        },
        {
          station: "Herero Community Radio",
          region: "Erongo, Namibia",
          language: "Otjiherero",
          severity: "medium",
          excerpt: "We will use new veto law if needed to protect ancestral lands.",
          timestamp: "1 day ago",
        },
      ]);
    }
    load();
  }, []);

  const mapMarkers: MapMarker[] = [
    ...signals.flatMap((s, idx) => {
      const code = countryCodeFromName(s.country);
      if (!code) return [];
      return [
        {
          id: `signal-${idx}`,
          label: s.title,
          countryCode: code,
          type: "signal" as const,
          intensity: s.severity,
          riskCategory: "political" as const,
        },
      ];
    }),

    ...passports.flatMap((p) => {
      const code = countryCodeFromName(p.country);
      if (!code) return [];
      const score = overallScore(p);
      return [
        {
          id: `supplier-${p.id}`,
          label: p.supplier,
          countryCode: code,
          type: "supplier" as const,
          intensity: intensityFromScore(score),
          riskCategory: "environmental" as const,
        },
      ];
    }),

    ...broadcasts.flatMap((b, idx) => {
      const code = countryCodeFromName(b.region);
      if (!code) return [];

      const region = b.region.toLowerCase();
      let peopleName: string | undefined;

      if (region.includes("cabo delgado")) {
        peopleName = "Balama communities";
      } else if (region.includes("yukon")) {
        peopleName = "Yukon First Nations";
      } else if (region.includes("acre")) {
        peopleName = "Amazon forest communities";
      } else if (region.includes("balochistan")) {
        peopleName = "Baloch communities";
      } else if (region.includes("kachin")) {
        peopleName = "Kachin Independence";
      } else if (region.includes("erongo") || region.includes("namibia")) {
        peopleName = "Herero communities";
      }

      return [
        {
          id: `broadcast-${idx}`,
          label: b.station,
          countryCode: code,
          type: "indigenous" as const,
          intensity: b.severity,
          peopleName,
          territoryName: b.region,
          riskCategory: "fpic" as const,
          forecastHorizonYears: 3,
        },
      ];
    }),
  ];

  const filteredSignals = selectedCountry
    ? signals.filter((s) => countryCodeFromName(s.country) === selectedCountry)
    : signals;

  const filteredBroadcasts = selectedCountry
    ? broadcasts.filter((b) => countryCodeFromName(b.region) === selectedCountry)
    : broadcasts;

  const handleCountryClick = (code: string) => {
    setSelectedCountry((prev) => (prev === code ? null : code));
    setFpicSidebarOpen(true);
    setCorridorCardOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* HERO */}
      <header className="bg-gradient-to-br from-slate-50 via-white to-emerald-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">
                Global Supply Chain Map
              </h1>
              <p className="text-lg text-slate-700 mt-2 max-w-3xl">
                FPIC disputes, geopolitical choke points, and regulatory horizon risks — mapped to
                your cathode supply chain in real time.
              </p>
            </div>
            <div className="flex items-center gap-3 text-emerald-600 font-bold">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              LIVE • HORIZON ACTIVE
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-20">
        {/* MAP */}
        <section className="relative">
          <h2 className="text-2xl font-bold mb-4">
            Global FPIC, Choke Points & Regulatory Horizon
          </h2>
          <p className="text-sm text-slate-600 max-w-3xl mb-6">
            FPIC grievances, election‑driven resource grabs, M23‑style corridor conflicts, and
            draft veto laws — visualized along the exact routes your battery passports depend on.
            Click a hotspot to see the signals and indigenous broadcasts underneath.
          </p>
          {selectedCountry && (
            <div className="mb-4 flex items-center gap-2 animate-fade-in">
              <Badge className="bg-slate-100 text-slate-800 border-slate-300">
                Filtered: {selectedCountry}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCountry(null);
                  setFpicSidebarOpen(false);
                  setCorridorCardOpen(false);
                }}
              >
                Clear filter
              </Button>
            </div>
          )}
          <div className="rounded-2xl border-2 border-slate-200 bg-slate-950 p-4 shadow-2xl backdrop-blur-xl bg-slate-950/95">
            <div className="flex justify-between text-xs text-slate-300 mb-3">
              <span className="font-bold uppercase tracking-wider">
                FPIC • Political • Horizon • Indigenous
              </span>
              <div className="flex gap-4">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Supplier
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" /> Signal
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" /> Indigenous
                </span>
              </div>
            </div>
            <WorldMap markers={mapMarkers} onSelectCountry={handleCountryClick} />
          </div>

          {/* Corridor Breakdown Card */}
          {corridorCardOpen && selectedCountry && CORRIDOR_DATA[selectedCountry] && (
            <Card className="absolute top-24 right-0 w-96 shadow-2xl border-slate-300 animate-slide-in-right z-10 backdrop-blur-xl bg-white/95">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-600" />
                      {CORRIDOR_DATA[selectedCountry].name}
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-1">Corridor Breakdown</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCorridorCardOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1">Key Routes</p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {CORRIDOR_DATA[selectedCountry].routes.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ChevronRight className="w-3 h-3 mt-0.5 text-emerald-600" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1">Active Threats</p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {CORRIDOR_DATA[selectedCountry].threats.map((t, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertCircle className="w-3 h-3 mt-0.5 text-rose-600" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-700">FPIC Risk</span>
                    {severityBadge(CORRIDOR_DATA[selectedCountry].fpicRisk)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* SIGNALS */}
        <section>
          <h2 className="text-2xl font-bold mb-6">
            Live + Horizon Signals
            {selectedCountry && (
              <span className="text-base font-normal text-slate-600 ml-3">
                (filtered by {selectedCountry})
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-600 mb-6 max-w-3xl">
            Regulatory horizon, coups, and corridor conflicts — scored for how likely they are to
            disrupt flows, trigger FPIC challenges, or force a rewrite of your battery passports
            and long‑term offtake contracts.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {filteredSignals.map((s, i) => (
              <Card
                key={i}
                className="hover:border-slate-400 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{s.title}</CardTitle>
                      <p className="text-xs text-slate-500">
                        {s.category} • {s.country}
                      </p>
                      {s.forecastHorizon && (
                        <p className="text-xs text-indigo-600 font-medium mt-1">
                          Horizon: {s.forecastHorizon}
                        </p>
                      )}
                      {s.source && (
                        <p className="text-xs text-slate-400 mt-1">Source: {s.source}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {severityBadge(s.severity)}
                      {s.forecastHorizon && horizonBadge()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-slate-700">{s.description}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* INDIGENOUS RADIO FEED */}
        <section>
          <h2 className="text-2xl font-bold mb-6">
            Indigenous Radio Feed
            {selectedCountry && (
              <span className="text-base font-normal text-slate-600 ml-3">
                (filtered by {selectedCountry})
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-600 mb-6 max-w-3xl">
            Live broadcasts from indigenous communities along your supply routes. Early warnings of
            FPIC disputes, land conflicts, and consultation breakdowns that could invalidate battery
            passport compliance.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {filteredBroadcasts.map((b, idx) => (
              <Card
                key={idx}
                className="hover:border-sky-400 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Radio className="w-4 h-4 text-sky-600" />
                        {b.station}
                      </CardTitle>
                      <p className="text-xs text-slate-500">
                        {b.region} • {b.language}
                      </p>
                    </div>
                    <div className="text-right">
                      {severityBadge(b.severity)}
                      <p className="text-[10px] text-slate-400 mt-1">{b.timestamp}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-slate-700">{b.excerpt}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* INTELLIGENCE MODULE GRID */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Intelligence Modules</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Globe,
                title: "Unified Dashboard",
                desc: "All regulatory, FPIC, and ESG signals in one stream.",
                tags: ["Real-time", "Multi-source"],
                gradient: "from-emerald-400 to-emerald-600",
                href: "/dashboard",
              },
              {
                icon: AlertCircle,
                title: "Political Risk Heatmap",
                desc: "Elections, coups, and policy shocks mapped to your suppliers.",
                tags: ["Geographic", "Risk Analysis"],
                gradient: "from-rose-400 to-rose-600",
                href: "/map",
              },
              {
                icon: Scale,
                title: "Legal Risk Intelligence",
                desc: "Treaty violations, ISDS triggers, cross-border disputes.",
                tags: ["Legal", "Compliance"],
                gradient: "from-indigo-400 to-indigo-600",
                href: "/legal",
              },
              {
                icon: Radio,
                title: "Indigenous Broadcasting",
                desc: "Live community alerts and FPIC grievance signals.",
                tags: ["FPIC Risk", "Live Feeds"],
                gradient: "from-sky-500 to-blue-600",
                href: "/radio",
              },
            ].map((m) => (
              <Card
                key={m.title}
                className="relative cursor-pointer hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
                onClick={() => router.push(m.href)}
              >
                <div
                  className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${m.gradient}`}
                />
                <CardHeader>
                  <m.icon className="w-8 h-8 text-slate-700 mb-3" />
                  <CardTitle className="text-lg">{m.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-3">{m.desc}</p>
                  <div className="flex gap-2 flex-wrap">
                    {m.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* PASSPORTS + BENCHMARKING MATRIX */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Approved Supplier Passports</h2>
            <Button
              onClick={() => router.push("/instrument")}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Go to Instrument →
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-8 w-64" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : passports.length === 0 ? (
            <Card className="p-12 text-center bg-slate-50">
              <p className="text-lg text-slate-700 mb-4">No passports yet</p>
              <Button
                onClick={() => router.push("/instrument")}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Create First Passport
              </Button>
            </Card>
          ) : (
            <>
              <div className="space-y-4 mb-12">
                {passports.map((p) => (
                  <Card
                    key={p.id}
                    className="hover:border-emerald-400 hover:shadow-lg transition-all duration-300"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-lg">{p.supplier}</CardTitle>
                          <p className="text-sm text-slate-500">{p.country}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/passport/${p.id}`)}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          View Passport
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-3">
                        {scoreTag("FPIC", p.fpicScore)}
                        {scoreTag("ESG", p.esgScore)}
                        {scoreTag("Political", p.politicalScore)}
                        <span className="ml-auto font-semibold text-slate-700">
                          Overall: {(overallScore(p) * 100).toFixed(0)}% →{" "}
                          {overallLabel(overallScore(p))}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Benchmark Table */}
              <div className="rounded-xl border overflow-hidden shadow-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">Supplier</th>
                      <th className="px-6 py-4 text-left font-semibold">Country</th>
                      <th className="px-6 py-4 text-left font-semibold">FPIC</th>
                      <th className="px-6 py-4 text-left font-semibold">ESG</th>
                      <th className="px-6 py-4 text-left font-semibold">Political</th>
                      <th className="px-6 py-4 text-left font-semibold">Overall</th>
                      <th className="px-6 py-4 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passports.map((p, i) => {
                      const score = overallScore(p);
                      const label = overallLabel(score);
                      const color =
                        label === "Ready"
                          ? "text-emerald-700"
                          : label === "Needs Review"
                          ? "text-amber-700"
                          : "text-rose-700";

                      return (
                        <tr
                          key={p.id}
                          className={`${
                            i % 2 ? "bg-slate-50" : "bg-white"
                          } hover:bg-slate-100 transition`}
                        >
                          <td className="px-6 py-4 font-medium text-slate-800">{p.supplier}</td>
                          <td className="px-6 py-4 text-slate-600">{p.country}</td>
                          <td className="px-6 py-4">{(p.fpicScore * 100).toFixed(0)}%</td>
                          <td className="px-6 py-4">{(p.esgScore * 100).toFixed(0)}%</td>
                          <td className="px-6 py-4">{(p.politicalScore * 100).toFixed(0)}%</td>
                          <td className="px-6 py-4 font-semibold">
                            {(score * 100).toFixed(0)}%
                          </td>
                          <td className={`px-6 py-4 font-medium ${color}`}>
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                              {label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>

      {/* FPIC Sidebar */}
      {fpicSidebarOpen && selectedCountry && (
        <div className="fixed top-0 right-0 h-full w-96 bg-white/95 backdrop-blur-xl shadow-2xl border-l border-slate-200 z-50 animate-slide-in-right overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-rose-600" />
                FPIC Risk Panel
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setFpicSidebarOpen(false)}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Selected Region</p>
                <Badge className="bg-slate-100 text-slate-800 border-slate-300">
                  {selectedCountry}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Active Signals</p>
                <div className="space-y-2">
                  {filteredSignals.slice(0, 3).map((s, i) => (
                    <Card key={i} className="p-3">
                      <p className="text-xs font-medium text-slate-800">{s.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {severityBadge(s.severity)}
                        <span className="text-[10px] text-slate-500">{s.category}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">
                  Indigenous Broadcasts
                </p>
                <div className="space-y-2">
                  {filteredBroadcasts.slice(0, 3).map((b, i) => (
                    <Card key={i} className="p-3">
                      <p className="text-xs font-medium text-slate-800">{b.station}</p>
                      <p className="text-xs text-slate-600 mt-1">{b.excerpt}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {severityBadge(b.severity)}
                        <span className="text-[10px] text-slate-500">{b.timestamp}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
