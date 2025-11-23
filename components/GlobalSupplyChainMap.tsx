"use client";

import React, { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup,
} from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";

const geoUrl =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// --- Tribal Hotspots ---
const tribalHotspots = [
  {
    id: "hualapai",
    name: "Hualapai Nation",
    coords: [-118.1, 41.6],
    legitimacy: 22,
    voice: "Sacred springs are life. No consent given.",
  },
  {
    id: "colla",
    name: "Colla & Lickanantay",
    coords: [-68.3, -23.4],
    legitimacy: 24,
    voice: "Our water is our blood. You are draining us.",
  },
  {
    id: "sami",
    name: "Sámi Parliament",
    coords: [20.0, 67.0],
    legitimacy: 39,
    voice: "Reindeer cannot drink electricity.",
  },
  {
    id: "makua",
    name: "Makua Communities",
    coords: [39.5, -13.0],
    legitimacy: 31,
    voice: "Our children flee bullets for your phones.",
  },
  {
    id: "kachin",
    name: "Kachin Independence",
    coords: [97.0, 26.0],
    legitimacy: 29,
    voice: "No consent. No minerals.",
  },
];

// --- Regulatory Horizon ---
const regulatoryHorizon = [
  {
    id: "namibia",
    name: "Namibia Veto Law",
    coords: [17.0, -22.0],
    year: "2026",
    impact: "Indigenous veto on uranium/lithium licensing",
  },
  {
    id: "argentina",
    name: "Argentina Lithium Tax Escalation",
    coords: [-65.0, -35.0],
    year: "2028–2030",
    impact: "Sliding lithium export tax 15→60% if unrefined",
  },
];

// --- Choke Points ---
const chokePoints = [
  {
    id: "china",
    name: "China REE Export Regime",
    coords: [104.0, 35.0],
    risk: "Dec 1 2025",
  },
  {
    id: "drc",
    name: "M23 Corridor Road Cut",
    coords: [25.8, -10.7],
    risk: "Active",
  },
];

// --- Flow Corridors ---
const corridors = [
  { from: [-118.1, 41.6], to: [4.9, 52.3], name: "Thacker Pass → EU" },
  { from: [-68.3, -23.4], to: [4.9, 52.3], name: "Atacama → EU" },
  { from: [25.8, -10.7], to: [4.9, 52.3], name: "DRC Cobalt → EU" },
];

export default function GlobalSupplyChainMap() {
  const [selected, setSelected] = useState<any>(null);

  return (
    <div className="relative bg-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-700 to-slate-800 p-6 border-b border-slate-600">
        <h2 className="text-xl font-bold text-white">
          Global FPIC, Choke Points & Regulatory Horizon
        </h2>
        <p className="text-sm text-slate-300 mt-1">
          Indigenous claims, geopolitics, and regulatory shifts — mapped to your supply chain
        </p>
      </div>

      {/* MAP */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 145, center: [10, 15] }}
      >
        <ZoomableGroup>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1e293b"
                  stroke="#334155"
                  strokeWidth={0.4}
                />
              ))
            }
          </Geographies>

          {/* Corridors */}
          {corridors.map((c) => (
            <Line
              key={c.name}
              from={c.from}
              to={c.to}
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeLinecap="round"
              className="opacity-70"
            />
          ))}

          {/* Tribal Hotspots */}
          {tribalHotspots.map((t) => (
            <Marker key={t.id} coordinates={t.coords}>
              <g
                className="cursor-pointer"
                onClick={() => setSelected({ ...t, type: "tribal" })}
              >
                <motion.circle
                  r={14}
                  fill="#22d3ee"
                  opacity={0.3}
                  animate={{ r: [14, 20] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <circle
                  r={8}
                  fill="#22d3ee"
                  stroke="white"
                  strokeWidth={2}
                />
              </g>
            </Marker>
          ))}

          {/* Regulatory Horizon */}
          {regulatoryHorizon.map((r) => (
            <Marker key={r.id} coordinates={r.coords}>
              <g
                className="cursor-pointer"
                onClick={() => setSelected({ ...r, type: "regulatory" })}
              >
                <circle r={10} fill="#fbbf24" opacity={0.7} />
                <circle r={6} fill="white" />
              </g>
            </Marker>
          ))}

          {/* Choke Points */}
          {chokePoints.map((c) => (
            <Marker key={c.id} coordinates={c.coords}>
              <g
                className="cursor-pointer"
                onClick={() => setSelected({ ...c, type: "choke" })}
              >
                <motion.circle
                  r={12}
                  fill="#ef4444"
                  opacity={0.4}
                  animate={{ r: [12, 18] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <circle r={8} fill="#dc2626" stroke="white" strokeWidth={3} />
              </g>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* LEGEND */}
      <div className="absolute bottom-4 left-4 bg-slate-900/80 rounded-xl px-4 py-2 text-xs text-white flex gap-4 border border-slate-700">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-cyan-500"></span> FPIC
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span> Horizon
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500"></span> Choke
        </span>
      </div>

      {/* SIDE PANEL */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="absolute right-0 top-0 h-full w-80 bg-slate-900 border-l border-slate-700 p-6 overflow-y-auto"
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-2xl font-bold text-white">{selected.name}</h3>

            {selected.type === "tribal" && (
              <>
                <p className="text-cyan-300 mt-2 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Indigenous Community
                </p>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mt-6">
                  <p className="italic text-cyan-200">"{selected.voice}"</p>
                </div>
                <p className="text-slate-300 mt-6 text-sm">
                  Legitimacy Index
                </p>
                <p className="text-4xl font-bold text-white">
                  {selected.legitimacy}
                </p>
              </>
            )}

            {selected.type === "regulatory" && (
              <>
                <p className="text-amber-400 mt-2">{selected.year}</p>
                <p className="text-slate-300 mt-4">{selected.impact}</p>
              </>
            )}

            {selected.type === "choke" && (
              <>
                <p className="text-red-400 mt-4 text-sm">Status</p>
                <p className="text-xl text-white mt-1">{selected.risk}</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

