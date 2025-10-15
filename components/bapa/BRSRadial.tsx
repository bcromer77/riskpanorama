// components/bapa/BRSRadial.tsx
"use client";
import React from "react";

export default function BRSRadial({ value }: { value: number }) {
  // value 0..100
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 60;
  const circ = 2 * Math.PI * radius;
  const pct = clamped / 100;
  const dash = circ * pct;

  const color =
    clamped < 50 ? "stroke-emerald-500"
    : clamped < 75 ? "stroke-amber-500"
    : "stroke-rose-500";

  return (
    <div className="relative w-40 h-40">
      <svg viewBox="0 0 160 160" className="w-full h-full">
        <circle cx="80" cy="80" r={radius} className="fill-none stroke-gray-200" strokeWidth="16" />
        <circle
          cx="80" cy="80" r={radius}
          className={`fill-none ${color} transition-all duration-500`}
          strokeWidth="16"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 80 80)"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-sm text-gray-500">Battery Risk</div>
          <div className="text-3xl font-semibold">{clamped}</div>
        </div>
      </div>
    </div>
  );
}

