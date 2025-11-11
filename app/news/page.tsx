"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Globe2, Zap, Database } from "lucide-react";

export default function NewsPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // mock vector matches (replace with MongoDB vector query)
    setArticles([
      {
        id: 1,
        title:
          "Rejected China locomotives cast shadow as Guinea’s Simandou mine marks milestone",
        summary:
          "Guinea enforces co-development clauses, rejecting Chinese locomotives in a $20B iron-ore project — underscoring new enforcement of ESG sourcing terms.",
        source: "South China Morning Post",
        date: "Nov 11, 2025",
        country: "Guinea",
        relevance: 0.92,
        tags: ["Supply Chain", "Geopolitics", "ESG"],
      },
      {
        id: 2,
        title:
          "AI’s $5 Trillion Data-Center Boom Will Dip Into Every Debt Market, JPMorgan Says",
        summary:
          "Massive AI infrastructure expansion set to strain global metals and energy supply — critical minerals like copper, lithium, and rare earths surge in strategic value.",
        source: "Bloomberg",
        date: "Nov 10, 2025",
        country: "Global",
        relevance: 0.89,
        tags: ["Energy Transition", "Finance", "AI Infrastructure"],
      },
      {
        id: 3,
        title:
          "Canada updates ESG Reporting Act — expanding audit scope for critical-mineral importers",
        summary:
          "New compliance standards align supply-chain traceability with EU Battery Regulation requirements — direct implications for graphite and cobalt importers.",
        source: "Official Gazette Canada",
        date: "Nov 6, 2025",
        country: "Canada",
        relevance: 0.84,
        tags: ["ESG", "Policy", "Regulation"],
      },
    ]);
    setLoading(false);
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-[60vh] text-slate-400 text-sm">
        Loading vector matches…
      </div>
    );

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Global Supply-Chain Signals
          </h1>
          <p className="text-sm text-slate-500">
            Ranked by semantic proximity to your regulatory and supplier
            datasets in MongoDB.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Database size={14} />
          <span>Vector Index: rareearthminerals.documents</span>
        </div>
      </motion.div>

      {/* Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
          >
            <div className="p-5 flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Globe2 size={14} />
                  <span>{a.country}</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-[2px] rounded-full ${
                    a.relevance > 0.9
                      ? "bg-emerald-100 text-emerald-700"
                      : a.relevance > 0.8
                      ? "bg-amber-100 text-amber-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {(a.relevance * 100).toFixed(0)}% match
                </span>
              </div>

              <h2 className="font-semibold text-slate-900 leading-snug text-base mb-2">
                {a.title}
              </h2>
              <p className="text-sm text-slate-600 line-clamp-3">{a.summary}</p>

              <div className="flex flex-wrap gap-2 mt-4">
                {a.tags.map((t: string, j: number) => (
                  <span
                    key={j}
                    className="text-[10px] bg-slate-100 text-slate-700 px-2 py-[2px] rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t px-5 py-3 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
              <span>{a.source}</span>
              <div className="flex items-center gap-1 text-emerald-700 font-medium hover:underline cursor-pointer">
                <span>View context</span>
                <ArrowUpRight size={14} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary insight */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border rounded-2xl p-6 bg-gradient-to-r from-emerald-50 via-white to-transparent shadow-sm"
      >
        <div className="flex items-center gap-3 mb-2 text-emerald-700 font-medium">
          <Zap size={16} />
          <span>AI Observation</span>
        </div>
        <p className="text-sm text-slate-700">
          <strong>Simandou</strong> and <strong>AI Infrastructure</strong> trends
          show high contextual overlap with your ESG Reporting Act 2025 filings.
          Vector embeddings reveal a 0.88 similarity score between “critical
          mineral sourcing” narratives and your Article 8 due-diligence corpus.
        </p>
      </motion.div>
    </main>
  );
}

