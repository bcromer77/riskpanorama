"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/risk/list")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-emerald-700 mb-6">
        Supplier Risk Dashboard
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((r, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition"
          >
            <h2 className="font-semibold text-slate-800 mb-2">
              {r.supplier || "Unknown Supplier"}
            </h2>
            <p className="text-sm text-slate-500 mb-2">
              SKU: {r.sku || "N/A"}
            </p>
            <span
              className={`text-xs px-3 py-1 rounded-full ${
                r.risk_score > 70
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {r.risk_score}% Risk
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

