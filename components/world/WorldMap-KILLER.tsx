// components/world/WorldMap.tsx — FINAL. 100% WORKING. NO MORE TEARS.

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const hotspots = [
  { id: "1", name: "Hualapai Nation", region: "Thacker Pass", quote: "Sacred springs are life. No consent given.", index: 22, coords: [-118.1, 41.6] },
  { id: "2", name: "Colla & Lickanantay", region: "Atacama Basin", quote: "Our water is our blood.", index: 24, coords: [-68.3, -23.4] },
  { id: "3", name: "Sámi", region: "Nordic Arctic", quote: "Reindeer cannot drink electricity.", index: 39, coords: [20.0, 67.0] },
  { id: "4", name: "China REE Veto", region: "Global supply", quote: "Export licenses required", index: 18, coords: [104.0, 35.0], type: "choke" },
  { id: "5", name: "DRC M23", region: "Cobalt corridor", quote: "Rebels control the highway", index: 28, coords: [25.8, -10.7], type: "choke" },
  { id: "6", name: "Myanmar Kachin", region: "Heavy REE", quote: "No consent. No minerals.", index: 29, coords: [97.0, 26.0] },
];

export default function WorldMap() {
  const [selected, setSelected] = useState<any>(null);

  const project = (lng: number, lat: number) => ({
    x: ((lng + 180) / 360) * 100,
    y: ((90 - lat) / 180) * 100,
  });

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <Image src="/world-map-dark.png" alt="Risk Map" fill className="object-cover" priority />

      {hotspots.map((spot) => {
        const { x, y } = project(spot.coords[0], spot.coords[1]);
        const isChoke = spot.type === "choke";
        const ring = isChoke ? "border-rose-500" : "border-cyan-400";
        const bg = isChoke ? "bg-rose-600" : "bg-cyan-500";

        return (
          <button
            key={spot.id}
            className="absolute z-20 group"
            style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
            onClick={() => setSelected(spot)}
          >
            <div className={`w-32 h-32 rounded-full border-8 ${ring} shadow-2xl`} />
            <div className={`absolute inset-4 rounded-full ${bg} shadow-inner`} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-black text-white drop-shadow-2xl">{spot.index}</span>
            </div>
          </button>
        );
      })}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="absolute inset-y-0 right-0 w-full max-w-2xl bg-black/95 backdrop-blur-2xl z-50 flex items-center justify-center p-20"
          >
            <button onClick={() => setSelected(null)} className="absolute top-12 right-12 text-7xl text-cyan-400 hover:text-white">
              ×
            </button>
            <div className="max-w-xl space-y-20">
              <h3 className="text-8xl font-black text-white">{selected.name}</h3>
              <p className="text-4xl text-cyan-400">{selected.region}</p>
              <blockquote className="text-6xl italic text-cyan-300 border-l-8 border-cyan-500 pl-16 leading-tight">
                “{selected.quote}”
              </blockquote>
              <div className="bg-gradient-to-br from-rose-900/80 to-black border-4 border-rose-700 rounded-3xl p-20 text-center">
                <p className="text-rose-400 text-4xl font-bold uppercase">Legitimacy Index</p>
                <p className="text-rose-500 text-9xl font-black mt-8">{selected.index}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
