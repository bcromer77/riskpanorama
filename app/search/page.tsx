// app/search/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Zap, AlertOctagon, X } from "lucide-react";

// -------------------------------
// Types
// -------------------------------
type SearchResult = {
  id: string;
  title: string;
  snippet: string;
  source: string;
  score: number;
};

// -------------------------------
// Main Component
// -------------------------------
export default function SearchPage() {
  const resultsRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("China rare earth export curbs");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [streamingText, setStreamingText] = useState("");

  // Streaming text effect
  useEffect(() => {
    if (searching) {
      const text = "Analyzing X posts, regulatory filings, indigenous broadcasts, treaty databases...";
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setStreamingText(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
        }
      }, 30);
      return () => clearInterval(interval);
    } else {
      setStreamingText("");
    }
  }, [searching]);

  const runSearch = () => {
    setSearching(true);
    setTimeout(() => {
      setResults([
        {
          id: "1",
          title: "China REE Export Curbs — Full Impact Report",
          snippet:
            "Dec 1 license regime could halt 6.2M EV production lines. Any product with >0.1% Chinese rare earths now requires Beijing re-export license. Analysts: 'This is the nuclear option.'",
          source: "X • Reuters",
          score: 0.98,
        },
        {
          id: "2",
          title: "M23 Corridor Disruption — DRC Cobalt Route Analysis",
          snippet:
            "Kolwezi–Zambia highway cut. Battery passport routes at risk of invalidation. M23 rebels control key highway from Kolwezi to Zambian border. Cobalt shipments halted.",
          source: "Reuters • X",
          score: 0.96,
        },
        {
          id: "3",
          title: "Telangana Political Risk — Mine Shutdown Manifesto",
          snippet:
            "Opposition party to phase out all mining if elected 2028. BRS party manifesto: 'No new mines, existing ones phased out.' Telangana hosts ~40% of India's graphite & lithium exploration.",
          source: "X • The Hindu",
          score: 0.95,
        },
        {
          id: "4",
          title: "Yukon FPIC Injunction — Kaska Dena Legal Challenge",
          snippet:
            "Court filing halts critical minerals road. Nickel/cobalt route to Alaska at risk. Kaska Dena Council seeks court order halting construction. Claims inadequate FPIC.",
          source: "CBC • Indigenous radio",
          score: 0.94,
        },
        {
          id: "5",
          title: "Namibia Indigenous Veto Bill Draft",
          snippet:
            "Traditional authorities to get binding veto on new licenses. Bill gives traditional authorities binding veto on uranium/lithium permits. Expected Q4 2026.",
          source: "Reuters Africa",
          score: 0.92,
        },
        {
          id: "6",
          title: "Mexico Lithium Nationalization Expands",
          snippet:
            "Sheinbaum administration extends AMLO's lithium monopoly. All private concessions under review. EU/US cathode contracts face renegotiation or cancellation risk.",
          source: "Bloomberg • X",
          score: 0.91,
        },
        {
          id: "7",
          title: "Brazil Amazon Grid — Indigenous Veto Threat",
          snippet:
            "Acre transmission lines cross uncontacted territories. Federal prosecutors warn project violates FPIC under ILO 169. Could delay lithium transport from Bolivia border.",
          source: "Folha • Amazonia radio",
          score: 0.89,
        },
        {
          id: "8",
          title: "Myanmar Civil War Cuts China's REE Feedstock",
          snippet:
            "Kachin insurgents control 90% of heavy rare earth mines. China's southern refining hubs now running at 60% capacity. Supply disruption imminent.",
          source: "Reuters • X battlefield reports",
          score: 0.88,
        },
      ]);
      setSearching(false);
      resultsRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO + SEARCH */}
      <header className="sticky top-0 z-50 bg-gradient-to-br from-slate-50 via-white to-emerald-50 border-b border-slate-200 shadow-lg backdrop-blur-xl bg-white/80">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 animate-fade-in">
                Supply Chain Risk Engine
              </h1>
              <p className="text-lg text-slate-700 mt-2 max-w-3xl">
                Ask questions about emerging FPIC disputes, regulatory horizon shifts, geopolitical
                choke points, and corridor conflicts. Get AI-analyzed intelligence from X,
                indigenous radio, regulatory filings, and treaty databases.
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

          <Card className="shadow-2xl border-slate-200 bg-white/95 backdrop-blur-md">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-slate-700">
                <Zap className="w-6 h-6 text-emerald-600" />
                <h2 className="text-xl font-bold">Ask the Risk Engine</h2>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Could new FPIC or export laws invalidate our DRC → Sweden battery route?"
                    className="h-12 text-base"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    disabled={searching}
                    className="px-8 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {searching ? (
                      "Scanning…"
                    ) : (
                      <>
                        Search <Search className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
                {searching && (
                  <p className="text-sm text-slate-500 font-mono animate-pulse">
                    {streamingText}
                  </p>
                )}
              </form>

              {/* Example queries */}
              {!searching && results.length === 0 && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Example Queries
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "China rare earth export curbs",
                      "M23 DRC cobalt corridor",
                      "Yukon FPIC injunction",
                      "Namibia indigenous veto bill",
                      "Mexico lithium nationalization",
                      "Brazil Amazon FPIC disputes",
                    ].map((ex) => (
                      <Button
                        key={ex}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setQuery(ex);
                          setTimeout(() => runSearch(), 100);
                        }}
                      >
                        {ex}
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
        {results.length > 0 && (
          <div className="animate-fade-in" ref={resultsRef}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <AlertOctagon className="w-6 h-6 text-slate-600" /> Risk Intelligence Results
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setResults([]);
                  setQuery("");
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {results.map((r, idx) => (
                <Card
                  key={r.id}
                  className="border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{r.title}</CardTitle>
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-xs">
                        Match {(r.score * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">{r.source}</p>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-700">{r.snippet}</CardContent>
                </Card>
              ))}
            </div>

            {/* Filters / Actions */}
            <div className="mt-8 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-700 mb-4">Refine Results</h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm">
                  Filter by Source
                </Button>
                <Button variant="outline" size="sm">
                  Filter by Category
                </Button>
                <Button variant="outline" size="sm">
                  Filter by Risk Level
                </Button>
                <Button variant="outline" size="sm">
                  Export Results
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!searching && results.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
              <Search className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Ready to scan the horizon
            </h3>
            <p className="text-slate-600 max-w-md mx-auto">
              Enter a query above to search across X posts, indigenous radio broadcasts, regulatory
              filings, and treaty databases for emerging supply chain risks.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
