// app/city/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CityReport = {
  city: string;
  summary: string;
  signals: { sector: string; signal: string; impact: string; window: string }[];
  deliveries: { sku: string; retailer?: string; store_name: string; qty: number; delivered_at: string }[];
  materials: { fleet: string; material: string; component: string; share: number }[];
  documents: { filename: string; summary?: string; score?: number }[];
  recommendation: string;
  generated_at: string;
};

const CITY_OPTIONS = ["Barcelona", "Paris", "Madrid", "London", "Milan"];

export default function CityPage() {
  const [city, setCity] = useState<string>("Barcelona");
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<CityReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // upload
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadMsg, setUploadMsg] = useState<string>("");

  // quick KPIs derived from report
  const kpis = useMemo(() => {
    if (!report) return null;
    const totalUnits = report.deliveries.reduce((s, d) => s + (d.qty || 0), 0);
    const stores = new Set(report.deliveries.map((d) => d.store_name)).size;
    return {
      signals: report.signals.length,
      deliveries: report.deliveries.length,
      totalUnits,
      fleets: report.materials.length,
      stores,
    };
  }, [report]);

  async function fetchReport(selectedCity: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bapa/city/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: selectedCity }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load city report");
      setReport(json.report || json); // supports either shape
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReport(city);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setUploadMsg("");
    try {
      const form = new FormData();
      form.append("file", file);
      // optional tags that help your ingest pipeline
      form.append("tags", JSON.stringify({ city, source: "city-dashboard-upload" }));

      const res = await fetch("/api/bapa/ingest", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Upload failed");
      setUploadMsg("✅ Uploaded and ingested. Vector index will reflect shortly.");
      setFile(null);
      // light refresh to pull in new docs if relevant
      fetchReport(city);
    } catch (err: any) {
      setUploadMsg(`❌ ${err.message || "Upload error"}`);
    } finally {
      setUploading(false);
    }
  }

  function printPDF() {
    // Simple, reliable demo: print-to-PDF the current dashboard
    window.print();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-emerald-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 grid place-items-center text-white font-bold">B</div>
            <div className="font-semibold tracking-tight">City Intelligence — Stone → Store → Floor</div>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="px-3 py-2 rounded-md border border-emerald-200 bg-white text-sm"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              {CITY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Button onClick={() => fetchReport(city)} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </Button>
            <Button variant="outline" onClick={printPDF}>
              Generate PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Page Body */}
      <main className="max-w-7xl mx-auto px-6 py-8 print:px-0">
        {/* Upload */}
        <Card className="mb-6">
          <CardContent className="p-5">
            <form onSubmit={handleUpload} className="flex flex-col md:flex-row items-start md:items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm text-slate-600 mb-1">Upload a PDF (e.g. municipal notice, ESG report)</label>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
              <Button type="submit" disabled={!file || uploading}>
                {uploading ? "Uploading…" : "Ingest PDF"}
              </Button>
              {uploadMsg && <p className="text-sm text-slate-600">{uploadMsg}</p>}
            </form>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="p-5 text-red-700">Error: {error}</CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && !report && (
          <Card className="mb-6">
            <CardContent className="p-5">Loading {city} report…</CardContent>
          </Card>
        )}

        {/* Content */}
        {report && (
          <>
            {/* Summary & Recommendation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card className="lg:col-span-2">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-light mb-2">{report.city} — City Report</h2>
                  <p className="text-slate-700">{report.summary}</p>
                  <p className="mt-3 text-emerald-700 font-medium">{report.recommendation}</p>
                  <p className="mt-2 text-xs text-slate-500">Generated: {new Date(report.generated_at).toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">KPIs</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <KPI label="Signals" value={kpis?.signals ?? 0} />
                    <KPI label="Deliveries" value={kpis?.deliveries ?? 0} />
                    <KPI label="Units" value={kpis?.totalUnits ?? 0} />
                    <KPI label="Fleets" value={kpis?.fleets ?? 0} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stone → Store → Floor */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <StageCard
                title="🪨 Stone — Inputs & ESG"
                items={
                  report.materials.length
                    ? report.materials.map((m) => `${m.material} → ${m.component} (${Math.round(m.share * 100)}%)`)
                    : ["No fleet material exposures recorded."]
                }
                hint="Supplier/material provenance, exposure shares."
              />
              <StageCard
                title="🏭 Store — Deliveries & Ops"
                items={
                  report.deliveries.length
                    ? report.deliveries.map(
                        (d) =>
                          `${d.store_name} — ${d.sku} (${d.qty}) • ${new Date(d.delivered_at).toLocaleDateString()}`
                      )
                    : ["No deliveries in last two quarters."]
                }
                hint="Logistics posture across stores."
              />
              <StageCard
                title="🛍️ Floor — Consumer Impact"
                items={
                  report.signals.length
                    ? report.signals.map((s) => `${s.sector}: ${s.signal} • ${s.impact}`)
                    : ["No active city signals."]
                }
                hint="What shoppers & staff will feel this week."
              />
            </div>

            {/* Signals + Docs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-light mb-3">Emerging City Signals</h3>
                  {report.signals.length === 0 && (
                    <p className="text-sm text-slate-600">No signals yet. Seed with <code>db.city_signals.insertMany()</code>.</p>
                  )}
                  <ul className="space-y-3">
                    {report.signals.map((s, i) => (
                      <li key={i} className="p-3 rounded-md border border-slate-200 bg-slate-50">
                        <p className="text-sm font-medium">{s.sector}</p>
                        <p className="text-sm text-slate-700">{s.signal}</p>
                        <p className="text-xs text-slate-500 mt-1">{s.impact}</p>
                        <p className="text-xs text-slate-500">{s.window}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-light mb-3">Relevant Documents (Vector Matches)</h3>
                  {report.documents.length === 0 && (
                    <p className="text-sm text-slate-600">No matches. Upload a PDF above to see it here.</p>
                  )}
                  <ul className="space-y-3">
                    {report.documents.map((d, i) => (
                      <li key={i} className="p-3 rounded-md border border-slate-200 bg-white">
                        <p className="text-sm font-medium">{d.filename}</p>
                        {d.summary && <p className="text-sm text-slate-700">{d.summary}</p>}
                        {typeof d.score === "number" && (
                          <p className="text-xs text-slate-500 mt-1">Vector score: {d.score.toFixed(2)}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Deliveries table */}
            <Card className="mb-12">
              <CardContent className="p-6 overflow-x-auto">
                <h3 className="text-lg font-light mb-3">Deliveries (Last Two Quarters)</h3>
                {report.deliveries.length === 0 ? (
                  <p className="text-sm text-slate-600">No deliveries found. Seed <code>inventory_shipments</code>.</p>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="py-2 pr-4">Store</th>
                        <th className="py-2 pr-4">Retailer</th>
                        <th className="py-2 pr-4">SKU</th>
                        <th className="py-2 pr-4">Qty</th>
                        <th className="py-2 pr-4">Delivered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.deliveries.map((d, i) => (
                        <tr key={i} className="border-t border-slate-200">
                          <td className="py-2 pr-4">{d.store_name}</td>
                          <td className="py-2 pr-4">{d.retailer || "—"}</td>
                          <td className="py-2 pr-4">{d.sku}</td>
                          <td className="py-2 pr-4">{d.qty}</td>
                          <td className="py-2 pr-4">
                            {new Date(d.delivered_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

/** Small KPI tile */
function KPI({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

/** Stage card for Stone / Store / Floor lanes */
function StageCard({ title, items, hint }: { title: string; items: string[]; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-light mb-2">{title}</h3>
        {hint && <p className="text-xs text-slate-500 mb-3">{hint}</p>}
        <ul className="space-y-2">
          {items.map((t, i) => (
            <li key={i} className="text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-md p-2">
              {t}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

import PolaroidRiskBoard from "@/components/bapa/PolaroidRiskBoard";

// ...
<PolaroidRiskBoard />

