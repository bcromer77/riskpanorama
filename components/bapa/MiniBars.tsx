// components/bapa/MiniBars.tsx
"use client";
import React from "react";

type Item = { label: string; value: number; hint?: string }; // value 0..1

export default function MiniBars({ items }: { items: Item[] }) {
  return (
    <div className="space-y-2">
      {items.map((it) => {
        const pct = Math.round(Math.max(0, Math.min(1, it.value)) * 100);
        const bar =
          pct < 50 ? "bg-emerald-500" : pct < 75 ? "bg-amber-500" : "bg-rose-500";
        return (
          <div key={it.label}>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{it.label}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
              <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
            </div>
            {it.hint && <div className="text-[11px] text-gray-500 mt-1">{it.hint}</div>}
          </div>
        );
      })}
    </div>
  );
}

