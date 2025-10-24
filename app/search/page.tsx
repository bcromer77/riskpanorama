"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    setLoading(true);
    const res = await fetch(`/api/risk/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.risks || []);
    setLoading(false);
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Regulatory Impact Intelligence</h1>
      <p className="text-slate-600 mb-6">
        See how new ESG or product safety regulations impact your SKUs, suppliers, and contracts.
      </p>

      <div className="flex gap-3 mb-8">
        <Input
          placeholder="Search for regulation keyword (e.g. passport, CBAM, lithium)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </Button>
      </div>

      {results.map((r, i) => (
        <Card key={i} className="mb-3">
          <CardContent className="p-4">
            <h2 className="font-semibold">{r.sku} — {r.supplier}</h2>
            <p className="text-sm text-slate-700 mt-1">Risk: {(r.risk_score * 100).toFixed(0)}%</p>
            <p className="text-sm text-slate-600 mt-2">{r.recommendations?.join(" • ")}</p>
          </CardContent>
        </Card>
      ))}
    </main>
  );
}

