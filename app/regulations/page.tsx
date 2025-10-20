// app/regulations/page.tsx

"use client";

import { useState } from "react";
import { Search, FileText, AlertTriangle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RegulationsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    setLoading(true);
    setResults([]);

    try {
      const res = await fetch(`/api/risk/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err: any) {
      console.error(err);
      alert("Search failed — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-indigo-50/20">
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-24">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-light text-slate-900 mb-4">
            Regulatory Impact Intelligence
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            See how new ESG or product safety regulations impact your SKUs, suppliers, and contracts.
          </p>
        </div>

        {/* Search box */}
        <div className="flex gap-3 max-w-2xl mx-auto mb-12">
          <Input
            placeholder="e.g. Battery Passport Regulation 2026"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border-slate-300"
          />
          <Button
            onClick={handleSearch}
            disabled={loading || !query}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? "Scanning..." : "Search"}
          </Button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-6">
            {results.map((r, i) => (
              <Card key={i} className="bg-white shadow-sm hover:shadow-md transition">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-medium text-slate-900 mb-2">
                        {r.sku} — {r.supplier}
                      </h2>
                      <p className="text-sm text-slate-600 mb-3">
                        Risk: <span className="text-red-600 font-semibold">{(r.risk_score * 100).toFixed(0)}%</span>
                      </p>
                      <p className="text-sm text-slate-700 mb-4">
                        {r.recommendations?.[0] || "No recommendations found"}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <FileText className="h-4 w-4" />
                        <span>Linked document: {r.document_id}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Button variant="outline" className="text-indigo-600 border-indigo-200">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!results.length && !loading && (
          <div className="max-w-lg mx-auto text-center mt-16">
            <BookOpen className="h-10 w-10 text-indigo-400 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              Search for a regulation to see which SKUs and suppliers are affected.
            </p>
          </div>
        )}

        {/* Error or no matches */}
        {results.length === 0 && loading === false && query && (
          <div className="text-center text-slate-500 mt-6">
            <AlertTriangle className="h-5 w-5 inline text-yellow-500 mr-2" />
            No matching SKUs found for this regulation.
          </div>
        )}
      </div>
    </div>
  );
}

