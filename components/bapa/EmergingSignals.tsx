"use client";

import React, { useEffect, useState } from "react";

type Signal = {
  headline: string;
  region?: string;
  risk_tier?: string;
  updated_at?: string;
};

export default function EmergingSignals() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch signals from API
  async function fetchSignals() {
    try {
      const res = await fetch("/api/bapa/signals", { cache: "no-store" });

      if (!res.ok) {
        console.error("API returned HTTP", res.status);
        setError(`Server returned ${res.status}`);
        setLoading(false);
        return;
      }

      let json: any = {};
      try {
        json = await res.json();
      } catch (err) {
        console.error("Failed to parse JSON:", err);
        setError("Invalid JSON response from server");
        setLoading(false);
        return;
      }

      if (json.success) {
        setSignals(json.signals || []);
      } else {
        setError("No signals found");
      }
    } catch (err: any) {
      console.error("Fetch failed:", err);
      setError("Failed to load signals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Color mapping for risk levels
  const getColor = (tier?: string) => {
    switch ((tier || "").toLowerCase()) {
      case "high":
        return "bg-red-100 border-l-4 border-red-500";
      case "medium":
        return "bg-yellow-100 border-l-4 border-yellow-400";
      case "low":
        return "bg-green-100 border-l-4 border-green-500";
      default:
        return "bg-gray-100 border-l-4 border-gray-300";
    }
  };

  return (
    <div className="bg-white border rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          🌍 Emerging Regulatory Signals
        </h2>
        <span className="text-xs text-gray-500 italic">Auto-refreshing</span>
      </div>

      {loading && (
        <p className="text-gray-500 text-sm italic">Loading signals...</p>
      )}

      {error && (
        <p className="text-red-600 text-sm border border-red-200 bg-red-50 p-2 rounded">
          ⚠️ {error}
        </p>
      )}

      {!loading && !error && signals.length === 0 && (
        <p className="text-gray-500 text-sm italic">No signals detected.</p>
      )}

      <div className="space-y-3 mt-3">
        {signals.map((sig, i) => (
          <div
            key={i}
            className={`${getColor(
              sig.risk_tier
            )} rounded-lg p-3 transition-all hover:shadow-md`}
          >
            <h3 className="font-medium text-gray-900 text-sm">
              {sig.headline}
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              {sig.region
                ? `${sig.region} • Risk Tier: ${sig.risk_tier || "Unknown"}`
                : `Risk Tier: ${sig.risk_tier || "Unknown"}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

