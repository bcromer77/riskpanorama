"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SKUComplianceScanner() {
  const [sku, setSku] = useState("Benkia 18650 9900mAh");
  const [brand, setBrand] = useState("");
  const [region, setRegion] = useState("Global");
  const [framework, setFramework] = useState("All");
  const [result, setResult] = useState<any | null>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔍 Fetch compliance report from /api/bapa/sku/report
  const handleScan = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bapa/sku/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, brand }),
      });
      const data = await res.json();
      if (data.success) setResult(data.compliance_card);
      else alert("❌ Failed to fetch compliance report.");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 📦 Fetch last 2 quarters of store deliveries
  const handleDeliveries = async () => {
    const res = await fetch(`/api/bapa/sku/deliveries?sku=${encodeURIComponent(sku)}`);
    const data = await res.json();
    if (data.success) setDeliveries(data.deliveries);
  };

  // 🧾 Generate Battery Passport Compliance Report
  const handleGenerateReport = async () => {
    const res = await fetch("/api/bapa/sku/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku }),
    });
    const data = await res.json();
    if (data.success) {
      const r = data.compliance_card;
      alert(
        `📘 Battery Passport Report — ${r.sku}\n\nBattery Risk Score: ${r.battery_risk_score}\nTier: ${r.tier}\nClassification: ${r.classification}\n\nRisk Drivers:\n${r.meaning}\n\nSources:\n${r.sources
          .map((s: any) => `• ${s.filename} (${(s.score * 100).toFixed(1)}%)`)
          .join("\n")}`
      );
    } else {
      alert("⚠️ Could not generate report.");
    }
  };

  return (
    <main className="p-10 max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">
        🔍 SKU Compliance Scanner
      </h1>

      {/* Input bar */}
      <div className="grid md:grid-cols-4 gap-3">
        <input
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="Enter SKU"
        />
        <input
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="Brand (optional)"
        />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option>Global</option>
          <option>Mexico</option>
          <option>Europe</option>
          <option>North America</option>
          <option>South America</option>
        </select>
        <Button onClick={handleScan} disabled={loading}>
          {loading ? "Scanning..." : "Scan"}
        </Button>
      </div>

      {/* Compliance report section */}
      {result && (
        <section className="grid md:grid-cols-3 gap-6">
          <Card className="col-span-1 p-5">
            <CardContent>
              <h2 className="font-semibold text-gray-800 mb-2">{result.sku}</h2>
              <p className="text-sm text-gray-600">Tier: {result.tier}</p>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700">Battery Risk</div>
                <div
                  className={`text-xl font-bold ${
                    result.battery_risk_score > 75
                      ? "text-red-600"
                      : result.battery_risk_score > 40
                      ? "text-yellow-500"
                      : "text-green-600"
                  }`}
                >
                  {result.battery_risk_score}
                </div>
              </div>
              <p className="text-xs mt-3 text-gray-500">{result.meaning}</p>
            </CardContent>
          </Card>

          <Card className="col-span-1 p-5">
            <CardContent>
              <h3 className="font-semibold text-gray-800 mb-2">
                Compliance Breakdown
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>🔋 Traceability Gap: {(result.panels.battery_passport.traceability_gap * 100).toFixed(0)}%</li>
                <li>🌍 ESG Risk: {result.panels.esg_supply_chain.risk_level}</li>
                <li>⚙️ Edge Alignment Variance: {(result.panels.consumer_safety.edge_alignment_variance * 100).toFixed(0)}%</li>
                <li>🔥 Capacity Ratio: {(result.panels.consumer_safety.capacity_ratio_vs_label * 100).toFixed(0)}%</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="col-span-1 p-5">
            <CardContent>
              <h3 className="font-semibold text-gray-800 mb-3">
                Stores Delivered (Last 2 Quarters)
              </h3>
              <Button onClick={handleDeliveries} className="mb-3">
                Refresh Deliveries
              </Button>
              {deliveries.length > 0 ? (
                <ul className="text-sm space-y-2">
                  {deliveries.map((d, i) => (
                    <li key={i} className="flex justify-between border-b pb-1">
                      <span>{d.store_name}</span>
                      <span className="text-gray-600 text-xs">
                        Qty {d.qty}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">
                  No deliveries found for {sku}.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <Button onClick={handleGenerateReport} variant="default">
          Generate Battery Passport Report
        </Button>
        <Button variant="outline" onClick={handleDeliveries}>
          Show Deliveries
        </Button>
      </div>
    </main>
  );
}

