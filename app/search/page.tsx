// app/search/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Zap,
  AlertOctagon,
  Shield,
  FileText,
  ExternalLink,
  Sparkles,
  Lock,
} from "lucide-react";

type SourceResult = {
  id: string;
  title: string;
  snippet: string;
  source: string;
  score: number;
  hash?: string;
  documentId?: string;
};

type AgentReport = {
  report: string;
  sources: {
    internal: SourceResult[];
    external: SourceResult[];
  };
  remainingCredits?: number;
  reportId?: string;
  viewUrl?: string;
};

export default function RiskIntelligencePage() {
  const router = useRouter();
  const resultsRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [report, setReport] = useState<AgentReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [showSources, setShowSources] = useState(true);

  const exampleQueries = [
    "Could new FPIC laws in DRC invalidate our cobalt route to Europe?",
    "What is the risk of Chinese rare earth export restrictions in 2026?",
    "Is our Yukon lithium project exposed to indigenous land claims?",
    "Namibia Marine Phosphate: Any veto risk from indigenous communities?",
    "M23 rebel control of Goma — impact on our coltan supply chain?",
  ];

  const allSources = [
    ...(report?.sources.internal.map(s => ({ ...s, type: "internal" as const })) ?? []),
    ...(report?.sources.external.map(s => ({ ...s, type: "external" as const, source: s.source || "Live Intelligence" })) ?? []),
  ].sort((a, b) => b.score - a.score);

  useEffect(() => {
    if (searching) {
      const text = "Agentic RAG active — scanning sealed evidence + live geopolitical signals (5 credits)…";
      let i = 0;
      const interval = setInterval(() => {
        setStreamingText(text.slice(0, i + 1));
        i++;
        if (i > text.length) clearInterval(interval);
      }, 25);
      return () => clearInterval(interval);
    } else {
      setStreamingText("");
    }
  }, [searching]);

  const runAgent = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setReport(null);
    setError(null);

    try {
      const res = await fetch("/api/agent/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 402) {
          setError("Insufficient credits — Agentic reports cost 5 credits each. Top up in Billing.");
        } else if (res.status === 401) {
          setError("Session expired. Please log in again.");
        } else {
          setError(data.error || "Agent failed. Please try again.");
        }
        return;
      }

      const data: AgentReport = await res.json();
      setReport(data);
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    } catch (err) {
      setError("Network error — check your connection and try again.");
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-slate-50">
      {/* Hero Header */}
      <header className="border-b border-emerald-500/20 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                Risk Intelligence Engine
              </h1>
              <p className="text-xl text-slate-300 mt-3 max-w-4xl">
                Strategic horizon scanning across your sealed evidence and live global risk signals.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-400 blur-xl animate-ping opacity-70"></div>
                <div className="relative bg-emerald-500 rounded-full w-4 h-4"></div>
              </div>
              <span className="text-emerald-400 font-semibold tracking-wider">LIVE</span>
            </div>
          </div>

          {/* Search Box */}
          <Card className="border-emerald-500/30 bg-slate-900/80 backdrop-blur shadow-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Zap className="w-7 h-7 text-emerald-400" />
                <h2 className="text-2xl font-bold">Ask the Risk Agent • 5 Credits</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={(e) => { e.preventDefault(); runAgent(); }} className="flex gap-4">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Could new FPIC laws block our lithium route from Chile?"
                  className="h-14 text-lg bg-slate-950/70 border-slate-700 focus:border-emerald-500 placeholder:text-slate-500"
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={searching || !query.trim()}
                  className="px-10 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold"
                >
                  {searching ? "Scanning…" : "Run Agent"}
                  {!searching && <Search className="ml-2 w-5 h-5" />}
                </Button>
              </form>

              {searching && (
                <p className="text-emerald-400 font-mono text-sm animate-pulse">
                  {streamingText}
                </p>
              )}

              {/* Example Queries */}
              {!report && !searching && (
                <div className="pt-6 border-t border-slate-800">
                  <p className="text-xs uppercase tracking-wider text-slate-500 mb-4">Strategic Examples</p>
                  <div className="flex flex-wrap gap-3">
                    {exampleQueries.map((q) => (
                      <Button
                        key={q}
                        variant="outline"
                        size="sm"
                        className="border-slate-700 text-xs hover:border-emerald-500 hover:text-emerald-400"
                        onClick={() => {
                          setQuery(q);
                          setTimeout(runAgent, 300);
                        }}
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">

        {/* Error State */}
        {error && (
          <Card className="mb-8 border-rose-500/50 bg-rose-950/50">
            <CardContent className="pt-6 flex items-start gap-4">
              <AlertOctagon className="w-8 h-8 text-rose-400 mt-1" />
              <div>
                <h3 className="font-bold text-rose-300">Agent Failed</h3>
                <p className="text-rose-200 text-sm mt-1">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report */}
        {report && (
          <div ref={resultsRef} className="space-y-8">

            {/* Synthesis */}
            <Card className="border-emerald-500/40 bg-slate-900/80 shadow-2xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                      <Sparkles className="w-7 h-7 text-emerald-400" />
                      Agentic Risk Synthesis
                    </h3>
                    {report.reportId && (
                      <p className="text-xs text-slate-400 mt-2">
                        Report ID: <span className="font-mono">{report.reportId.slice(-8)}</span>
                        {report.viewUrl && (
                          <a href={report.viewUrl} target="_blank" className="ml-3 text-emerald-400 hover:underline flex items-center gap-1">
                            View Full Report <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </p>
                    )}
                  </div>
                  {report.remainingCredits !== undefined && (
                    <Badge className="bg-emerald-900/80 text-emerald-300 text-lg px-4 py-2">
                      <Lock className="w-4 h-4 mr-2" />
                      {report.remainingCredits} Credits Left
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none text-slate-200 leading-relaxed text-lg">
                  {report.report.split("\n").map((para, i) => (
                    <p key={i} className="mb-4">{para || " "}</p>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="mt-8 border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/10"
                  onClick={() => setShowSources(!showSources)}
                >
                  {showSources ? "Hide" : "Show"} Source Evidence ({allSources.length})
                </Button>
              </CardContent>
            </Card>

            {/* Sources */}
            {showSources && (
              <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <Shield className="w-6 h-6 text-emerald-400" />
                  Source Evidence & Audit Trail
                </h3>
                <div className="grid gap-5 md:grid-cols-2">
                  {allSources.map((src) => (
                    <Card
                      key={src.id}
                      className={`border ${src.type === "internal" ? "border-emerald-500/40 bg-emerald-950/30" : "border-cyan-500/40 bg-cyan-950/20"} hover:shadow-xl transition-all`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-sm font-semibold">
                            {src.title}
                          </CardTitle>
                          {src.type === "internal" ? (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-700 text-xs">
                              <Shield className="w-3 h-3 mr-1" /> Sealed Vault
                            </Badge>
                          ) : (
                            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-700 text-xs">
                              <Zap className="w-3 h-3 mr-1" /> Live Intel
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                          Relevance: {(src.score * 100).toFixed(1)}%
                          {src.hash && ` • Hash: ${src.hash.slice(0, 10)}...`}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {src.snippet}
                        </p>
                        {src.type === "internal" && src.documentId && (
                          <a
                            href={`/vault/${src.documentId}`}
                            className="inline-flex items-center gap-1 mt-3 text-xs text-emerald-400 hover:underline"
                          >
                            <FileText className="w-3 h-3" /> Open Sealed Document
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!report && !searching && !error && (
          <div className="text-center py-32">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 mb-8">
              <Search className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Ask Anything About Your Supply Chain Risk</h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              The Risk Agent combines your sealed compliance evidence with live geopolitical, regulatory, and indigenous rights signals — in seconds.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
