"use client";
import React, { useEffect, useState } from "react";

export default function SignalsPage() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSignals() {
      try {
        const res = await fetch("/api/bapa/signals");
        const data = await res.json();
        setSignals(data.signals || []);
      } catch (e) {
        console.error("Error fetching signals:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchSignals();
  }, []);

  if (loading) return <p className="p-6 text-slate-600">Loading emerging signals...</p>;

  return (
    <div className="max-w-4xl mx-auto mt-6 space-y-6">
      <h1 className="text-3xl font-light text-slate-800 mb-4 flex items-center gap-2">
        🌍 Emerging Regulatory Signals
      </h1>
      {signals.length === 0 ? (
        <p className="text-slate-500 text-sm">No signals found in database.</p>
      ) : (
        <div className="grid gap-4">
          {signals.map((sig, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg shadow-sm border ${
                sig.risk_tier === "High"
                  ? "border-rose-300 bg-rose-50"
                  : sig.risk_tier === "Medium"
                  ? "border-amber-300 bg-amber-50"
                  : "border-emerald-300 bg-emerald-50"
              }`}
            >
              <p className="font-medium text-slate-800">{sig.headline}</p>
              <p className="text-xs text-slate-600 mt-1">
                {sig.region} • Risk Tier: {sig.risk_tier}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

