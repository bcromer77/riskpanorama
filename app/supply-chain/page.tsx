// app/supply-chain/page.tsx

"use client";

import WorldMap from "@/components/world/WorldMap";
import { useState } from "react";
import { Filter } from "lucide-react";

const filters = ["All", "FPIC", "Political", "Suppliers", "Indigenous"];

export default function SupplyChainPage() {
  const [active, setActive] = useState("All");

  return (
    <div className="min-h-screen bg-[#081018] text-white pb-20">
      <div className="max-w-7xl mx-auto px-6 pt-12 space-y-3">
        <h1 className="text-3xl font-bold">
          Global Supply-Chain Risk ·{" "}
          <span className="text-emerald-400">Panorama</span>
        </h1>

        <p className="text-slate-400 max-w-3xl">
          FPIC tension, political risk, election volatility, indigenous signals,
          water stress and supplier legitimacy — visualised together.
        </p>

        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <div className="rounded-full bg-slate-800/50 px-3 py-2 flex items-center gap-2 text-xs">
            <Filter className="h-4 w-4" />
            Filters
          </div>

          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`px-4 py-1.5 rounded-full text-sm border transition ${
                active === f
                  ? "bg-emerald-500 text-emerald-900 border-emerald-400"
                  : "bg-slate-800/30 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
          <WorldMap activeFilter={active} />
        </div>
      </div>
    </div>
  );
}

