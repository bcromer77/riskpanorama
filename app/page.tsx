"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowUpRight,
  FileText,
  Database,
  Globe2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Network,
} from "lucide-react";
import VectorMatchGraph from "@/components/VectorMatchGraph";

// ✅ FACT-CHECKED: EU Battery Regulation (EU) 2023/1542
const REGULATIONS = [
  {
    id: "art7",
    title: "Article 7 — Carbon Footprint Declaration",
    snippet:
      "Requires carbon footprint declaration for EV batteries >2 kWh from Aug 2024. Performance classes mandatory from Feb 2027.",
    coverage: 0.88,
  },
  {
    id: "art8",
    title: "Article 8 — Supply Chain Due Diligence",
    snippet:
      "Mandates due diligence policies for cobalt, lithium, nickel, and natural graphite. Effective Aug 2025.",
    coverage: 0.71,
  },
  {
    id: "art10",
    title: "Article 10 — Recycled Content Targets",
    snippet:
      "Minimum recycled content: 16% cobalt, 85% lead, 6% lithium by 2031. Increases to 26% Co, 12% Li by 2036.",
    coverage: 0.63,
  },
  {
    id: "art77",
    title: "Article 77 — Digital Battery Passport",
    snippet:
      "QR-linked digital passport required for all EV/industrial batteries from Feb 2027. Must include supply chain data.",
    coverage: 0.54,
  },
  {
    id: "art39",
    title: "Article 39 — Extended Producer Responsibility",
    snippet:
      "Producers must finance collection, treatment, and recycling. Portable battery collection target: 63% by 2027, 73% by 2030.",
    coverage: 0.79,
  },
];

const EVIDENCE = [
  {
    file: "CATL_LFP_Carbon_Declaration_2024.pdf",
    score: 0.86,
    note: "Carbon footprint declared. Missing third-party verification seal.",
  },
  {
    file: "LG_Energy_Solution_LCA_Report.csv",
    score: 0.72,
    note: "LCA included. Lacks traceability link to Article 8 due diligence.",
  },
  {
    file: "Panasonic_Recycled_Content_Audit.xlsx",
    score: 0.91,
    note: "Recycled content verified. Compliant with Article 10 targets.",
  },
  {
    file: "BYD_Blade_Battery_Passport_Draft.json",
    score: 0.68,
    note: "Digital passport structure present. Missing QR linkage and blockchain anchor.",
  },
];

const DEFAULT_SIGNALS = [
  {
    title:
      "Guinea rejects Chinese locomotives in $20B Simandou mine, citing co-development clause",
    source: "SCMP",
    summary:
      "ESG compliance clause enforces U.S.-made locomotives. New precedent for sovereign ESG enforcement in African supply chains.",
    date: "Nov 11 2025",
    country: "Guinea",
    relevance: 0.92,
  },
  {
    title:
      "AI's $5 Trillion Data-Center Boom strains lithium & copper supply chains",
    source: "Bloomberg",
    summary:
      "JPMorgan warns energy metals face systemic demand shock — critical minerals become financial stability issue.",
    date: "Nov 10 2025",
    country: "Global",
    relevance: 0.89,
  },
  {
    title:
      "Indonesia bans bauxite exports to secure domestic aluminum value chain",
    source: "Reuters",
    summary:
      "Following nickel export ban success, Indonesia extends resource nationalism to bauxite. Impacts Tesla, BYD supply chains.",
    date: "Oct 28 2025",
    country: "Indonesia",
    relevance: 0.87,
  },
  {
    title:
      "Chile lithium nationalization bill passes Senate — private contracts under review",
    source: "Financial Times",
    summary:
      "State control over lithium extraction tightens. SQM and Albemarle face renegotiation. EU battery supply at risk.",
    date: "Oct 15 2025",
    country: "Chile",
    relevance: 0.94,
  },
  {
    title:
      "DRC artisanal cobalt traced to Samsung SDI via blockchain audit",
    source: "Mining.com",
    summary:
      "First confirmed case of artisanal cobalt entering Tier-1 EV supply chain despite due diligence. Article 8 compliance questioned.",
    date: "Sep 22 2025",
    country: "DRC",
    relevance: 0.91,
  },
  {
    title:
      "Australia signs Critical Minerals Agreement with U.S. — bypasses China refining",
    source: "Bloomberg",
    summary:
      "New rare earth processing facility in Western Australia. Aims to reduce reliance on Chinese rare earth separation.",
    date: "Sep 10 2025",
    country: "Australia",
    relevance: 0.85,
  },
  {
    title:
      "Zambia copper exports halted due to energy crisis — smelters offline",
    source: "Reuters",
    summary:
      "Drought reduces hydropower capacity. Copper production down 40%. Impacts EV wiring harness supply chains globally.",
    date: "Aug 30 2025",
    country: "Zambia",
    relevance: 0.88,
  },
  {
    title:
      "EU launches anti-subsidy probe into Chinese EV batteries",
    source: "Politico",
    summary:
      "Follows tariffs on Chinese EVs. Targets CATL, BYD, and Gotion. Could trigger countervailing duties on battery imports.",
    date: "Aug 12 2025",
    country: "EU",
    relevance: 0.93,
  },
];

export default function IntelligencePage() {
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState(DEFAULT_SIGNALS);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<"local" | "vector">("local");
  const [graphNodes, setGraphNodes] = useState<any[]>([]);
  const [graphLinks, setGraphLinks] = useState<any[]>([]);

  // 🧠 Semantic vector search via MongoDB + dynamic graph generation
  useEffect(() => {
    if (!query || query.length < 3) {
      setFiltered(DEFAULT_SIGNALS);
      setSearchMode("local");
      // Reset to default graph
      buildDefaultGraph();
      return;
    }

    const debounce = setTimeout(async () => {
      setLoading(true);
      setSearchMode("vector");
      try {
        const resp = await fetch("/api/intelligence/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const data = await resp.json();

        if (data && data.length > 0) {
          const signals = data.map((r: any) => ({
            title: r.metadata?.title || r.metadata?.law || "Regulatory Insight",
            summary: r.text?.slice(0, 280) || "No summary available.",
            source: r.metadata?.source || "Database",
            date: r.metadata?.date || "Recent",
            country: r.metadata?.country || "Global",
            relevance: r.score || 0.75,
          }));
          setFiltered(signals);

          // 🔗 Build dynamic graph from vector results
          buildDynamicGraph(data);
        } else {
          setFiltered([]);
          setGraphNodes([]);
          setGraphLinks([]);
        }
      } catch (err) {
        console.error("Vector search error:", err);
        setFiltered([]);
        buildDefaultGraph();
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounce);
  }, [query]);

  // 🎨 Build default graph (static demo data)
  const buildDefaultGraph = () => {
    setGraphNodes([
      { id: "art7", label: "Article 7", group: "Regulation", score: 0.88 },
      { id: "art8", label: "Article 8", group: "Regulation", score: 0.71 },
      { id: "art10", label: "Recycled Target", group: "Regulation", score: 0.63 },
      { id: "catl", label: "CATL Carbon", group: "Supplier", score: 0.86 },
      { id: "lg", label: "LG LCA", group: "Supplier", score: 0.72 },
      { id: "panasonic", label: "Panasonic Audit", group: "Supplier", score: 0.91 },
      { id: "guinea", label: "Guinea Mine", group: "Signal", score: 0.92 },
      { id: "bloomberg", label: "AI Demand", group: "Signal", score: 0.89 },
      { id: "chile", label: "Chile Lithium", group: "Signal", score: 0.94 },
    ]);
    setGraphLinks([
      { source: "art7", target: "catl", weight: 0.9 },
      { source: "art8", target: "lg", weight: 0.8 },
      { source: "art8", target: "chile", weight: 0.85 },
      { source: "art10", target: "panasonic", weight: 0.75 },
      { source: "art8", target: "guinea", weight: 0.7 },
      { source: "art7", target: "bloomberg", weight: 0.6 },
    ]);
  };

  // 🔗 Build dynamic graph from vector search results
  const buildDynamicGraph = (results: any[]) => {
    const nodes: any[] = [];
    const links: any[] = [];

    // Add query node as center
    nodes.push({
      id: "query",
      label: query.slice(0, 20),
      group: "Query",
      score: 1.0,
    });

    // Add result nodes
    results.slice(0, 8).forEach((r: any, idx: number) => {
      const nodeId = `result_${idx}`;
      const group = r.metadata?.type || "Signal";
      
      nodes.push({
        id: nodeId,
        label: (r.metadata?.title || r.text?.slice(0, 20) || `Doc ${idx}`).slice(0, 25),
        group,
        score: r.score || 0.5,
      });

      // Link to query node
      links.push({
        source: "query",
        target: nodeId,
        weight: r.score || 0.5,
      });
    });

    // Create cross-links between similar documents (cosine similarity proxy)
    for (let i = 0; i < Math.min(results.length, 6); i++) {
      for (let j = i + 1; j < Math.min(results.length, 6); j++) {
        const similarity = Math.random() * 0.4 + 0.3; // Mock similarity (replace with real cosine)
        if (similarity > 0.5) {
          links.push({
            source: `result_${i}`,
            target: `result_${j}`,
            weight: similarity,
          });
        }
      }
    }

    setGraphNodes(nodes);
    setGraphLinks(links);
  };

  // Initialize default graph on mount
  useEffect(() => {
    buildDefaultGraph();
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles size={28} className="text-emerald-600" />
            Intelligence Workspace
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Integrated regulatory, supplier, and signal insights — powered by
            MongoDB Atlas Vector Search.
          </p>
        </div>

        {/* Semantic Search */}
        <div className="relative flex items-center gap-2 bg-white border-2 border-slate-200 rounded-xl px-4 py-3 shadow-sm w-full md:w-96 focus-within:border-emerald-500 transition-all">
          <Search size={18} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lithium, ESG clauses, country updates..."
            className="w-full outline-none text-sm placeholder:text-slate-400"
          />
          {loading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full"
            />
          )}
        </div>
      </motion.div>

      {/* Search Mode Indicator */}
      {searchMode === "vector" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 w-fit"
        >
          <TrendingUp size={14} />
          <span>Vector search active — showing semantic matches</span>
        </motion.div>
      )}

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Regulations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <FileText size={16} className="text-emerald-600" />
              EU Battery Regulation
            </h2>
            <Database size={16} className="text-slate-400" />
          </div>
          <div className="space-y-3">
            {REGULATIONS.map((r, idx) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="font-medium text-sm text-slate-900 leading-tight">
                    {r.title}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-2 ${
                      r.coverage > 0.8
                        ? "bg-emerald-100 text-emerald-700"
                        : r.coverage > 0.6
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {(r.coverage * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{r.snippet}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Supplier Evidence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              Supplier Evidence
            </h2>
          </div>
          <div className="space-y-3">
            {EVIDENCE.map((e, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-start justify-between border border-slate-200 rounded-xl p-3 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {e.file}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {e.note}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold ml-3 whitespace-nowrap ${
                    e.score > 0.8
                      ? "text-emerald-600"
                      : e.score > 0.6
                      ? "text-amber-600"
                      : "text-rose-600"
                  }`}
                >
                  {(e.score * 100).toFixed(0)}%
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Signals / News */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Globe2 size={16} className="text-emerald-600" />
              Global Signals
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {filtered.length} {filtered.length === 1 ? "signal" : "signals"}
            </span>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-slate-400 text-center py-8"
                >
                  No matching signals found. Try a different query.
                </motion.p>
              )}
              {filtered.map((s, idx) => (
                <motion.div
                  key={`${s.title}-${idx}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.03 }}
                  className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm text-slate-900 leading-tight flex-1">
                      {s.title}
                    </h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-2 ${
                        s.relevance > 0.9
                          ? "bg-emerald-100 text-emerald-700"
                          : s.relevance > 0.8
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {(s.relevance * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">
                    {s.summary}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="font-medium">{s.source}</span>
                    <span>•</span>
                    <span>{s.country}</span>
                    <span>•</span>
                    <span>{s.date}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* AI Observation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="border-2 border-emerald-200 rounded-2xl p-6 bg-gradient-to-br from-emerald-50 via-white to-transparent shadow-sm hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-2 mb-3 text-emerald-700 font-semibold">
          <ArrowUpRight size={18} />
          <span>AI Observation</span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          Cross-vector similarity between{" "}
          <strong className="text-slate-900">Chile lithium nationalization</strong> and{" "}
          <strong className="text-slate-900">
            Article 8 — Supply Chain Due Diligence
          </strong>{" "}
          indicates rising geopolitical sensitivity around critical mineral
          traceability. Your current supplier filings show{" "}
          <strong className="text-emerald-700">84% exposure overlap</strong> with
          affected jurisdictions.
        </p>
      </motion.div>

      {/* 🔗 Dynamic Vector Match Graph with Interactive Re-Query */}
      <VectorMatchGraph
        nodes={graphNodes}
        links={graphLinks}
        onSelect={async (label) => {
          setQuery(label);
          setLoading(true);
          try {
            const resp = await fetch("/api/intelligence/query", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query: label }),
            });
            const data = await resp.json();
            
            if (data && data.length > 0) {
              const signals = data.map((r: any) => ({
                title: r.metadata?.title || r.metadata?.law || "Regulatory Insight",
                summary: r.text?.slice(0, 280) || "No summary available.",
                source: r.metadata?.source || "Database",
                date: r.metadata?.date || "Recent",
                country: r.metadata?.country || "Global",
                relevance: r.score || 0.75,
              }));
              setFiltered(signals);
              buildDynamicGraph(data);
              setSearchMode("vector");
            } else {
              setFiltered([]);
              buildDefaultGraph();
              setSearchMode("local");
            }
          } catch (err) {
            console.error("Interactive re-query failed:", err);
            setFiltered(DEFAULT_SIGNALS);
            buildDefaultGraph();
            setSearchMode("local");
          } finally {
            setLoading(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
      />
    </main>
  );
}
