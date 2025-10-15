"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import EmergingSignals from "@/components/bapa/EmergingSignals";

export default function BAPAHome() {
  const [sku, setSku] = useState("Benkia 18650 9900mAh");
  const [brand, setBrand] = useState("");
  const [framework, setFramework] = useState("EU Battery Passport");
  const [region, setRegion] = useState("Global");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runScan = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bapa/sku/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, brand }),
      });
      const data = await res.json();
      setResult(data.success ? data.compliance_card : null);
      if (!data.success) alert("Scan failed: " + data.error);
    } catch (err) {
      alert("Error during scan");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    const res = await fetch("/api/bapa/sku/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sku}-CompliancePack.pdf`;
      a.click();
    } else {
      alert("Failed to generate PDF.");
    }
  };

  return (
    <div className="min-h-screen bg-green-50">
      {/* ---------- NAVBAR ---------- */}
      <nav className="flex justify-between items-center px-8 py-4 bg-white shadow">
        <h1 className="text-lg font-semibold text-green-700">
          BAPA — Battery & Provenance Assistant
        </h1>
        <div className="flex gap-6 text-sm text-gray-700">
          <Link href="/" className="hover:text-green-600">Home</Link>
          <Link href="/sku" className="hover:text-green-600">Sku</Link>
          <Link href="/ask" className="hover:text-green-600">Ask</Link>
          <Link href="/signals" className="hover:text-green-600">Signals</Link>
          <Link href="/dashboard" className="hover:text-green-600">Dashboard</Link>
        </div>
      </nav>

      {/* ---------- MAIN ---------- */}
      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">🔍 SKU Compliance Scanner</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              placeholder="Enter SKU"
            />
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              placeholder="Brand (optional)"
            />
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full"
            >
              <option>Global</option>
              <option>Mexico</option>
              <option>EU</option>
              <option>USA</option>
              <option>China</option>
            </select>
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full"
            >
              <option>EU Battery Passport</option>
              <option>US TSA/FAA Lithium</option>
              <option>CBAM / Carbon Border</option>
              <option>UN ESG Framework</option>
            </select>
          </div>

          <div className="flex gap-3 mb-6">
            <Button
              onClick={runScan}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? "Scanning..." : "Scan"}
            </Button>
            <Button
              onClick={generatePDF}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Generate PDF Compliance Pack
            </Button>
          </div>

          {result && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">
                {result.sku} ({result.tier})
              </h3>
              <p className="text-gray-700 mb-2">{result.classification}</p>
              <p className="text-2xl text-green-600 font-bold mb-4">
                Battery Risk Score: {result.battery_risk_score}
              </p>
              <p className="text-gray-700">{result.meaning}</p>
            </div>
          )}
        </div>

        {/* ---------- SIGNALS PANEL ---------- */}
        <div>
          <EmergingSignals />
        </div>
      </div>
    </div>
  );
}

