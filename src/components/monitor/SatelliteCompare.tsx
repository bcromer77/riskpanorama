"use client";

import { useMemo, useState } from "react";
import type { SatelliteLayer } from "@/lib/api";

function fmt(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString([], { year: "numeric", month: "short", day: "numeric" });
}

export default function SatelliteCompare({ sat }: { sat: SatelliteLayer }) {
  const [split, setSplit] = useState(50);

  const before = sat.frames[0];
  const after = sat.frames[1];

  const meta = useMemo(() => {
    const prov = [before.provider, after.provider].filter(Boolean).join(" → ");
    return prov || "Satellite (stub)";
  }, [before.provider, after.provider]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-100">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Satellite imagery</div>
          <div className="text-sm font-medium text-slate-900">{meta}</div>
          <div className="text-xs text-slate-500 mt-1">
            Before: {fmt(before.ts)} • After: {fmt(after.ts)}
          </div>
        </div>
        <div className="text-xs text-slate-500 text-right">
          {sat.center.lat.toFixed(3)}, {sat.center.lng.toFixed(3)}
          {typeof sat.zoom === "number" ? ` • z${sat.zoom}` : ""}
        </div>
      </div>

      <div className="relative aspect-[16/10] bg-slate-50">
        {/* Base = AFTER */}
        <img
          src={after.url}
          alt="After"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Top = BEFORE, clipped */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${split}%` }}
        >
          <img
            src={before.url}
            alt="Before"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Divider */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-white shadow"
          style={{ left: `${split}%` }}
        />

        {/* Labels */}
        <div className="absolute left-3 top-3 text-xs px-2 py-1 rounded-full bg-white/90 border border-slate-200">
          Before
        </div>
        <div className="absolute right-3 top-3 text-xs px-2 py-1 rounded-full bg-white/90 border border-slate-200">
          After
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>Reveal before</span>
          <span>{split}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={split}
          onChange={(e) => setSplit(Number(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
}
