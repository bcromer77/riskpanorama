// components/world/WorldMap.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";

// -----------------------------------
// Types
// -----------------------------------
export type MapMarker = {
  id: string;
  label: string;
  countryCode: string;
  type: "supplier" | "signal" | "indigenous";
  intensity: "low" | "medium" | "high";

  // Indigenous & FPIC context (optional, but used if present)
  peopleName?: string;              // e.g. "Balama communities", "Sámi"
  territoryName?: string;           // e.g. "Cabo Delgado, Mozambique"
  riskCategory?: "fpic" | "political" | "environmental";
  forecastHorizonYears?: number;    // e.g. 3
};

type ThreatCorridor = {
  id: string;
  from: string;   // countryCode
  to: string;     // countryCode
  intensity: "low" | "medium" | "high";
  label?: string; // optional: "Balama graphite → EU cathode supply"
};

type Props = {
  markers: MapMarker[];
  onSelectCountry?: (code: string) => void;
};

// -----------------------------------
// Country coordinates lookup (Expanded with new hotspots)
// -----------------------------------
const COUNTRY_COORDS: Record<string, { lat: number; lon: number }> = {
  MZ: { lat: -18.6, lon: 35.5 },   // Mozambique
  MX: { lat: 23.6, lon: -102.5 },  // Mexico
  SE: { lat: 63.0, lon: 16.0 },    // Sweden
  NO: { lat: 65.0, lon: 13.0 },    // Norway / Sápmi
  CA: { lat: 60.0, lon: -110.0 },  // Canada (Yukon)
  BR: { lat: -9.0, lon: -70.0 },   // Brazil (Acre)
  CD: { lat: -4.0, lon: 23.0 },    // DRC
  PK: { lat: 30.0, lon: 69.0 },    // Pakistan (Balochistan approx)
  EU: { lat: 50.0, lon: 10.0 },    // EU centroid (for corridors)
  CN: { lat: 35.0, lon: 103.0 },   // China
  IN: { lat: 22.0, lon: 79.0 },    // India
  ID: { lat: -2.0, lon: 118.0 },   // Indonesia
  ML: { lat: 17.0, lon: -4.0 },    // Mali (Sahel)
  MM: { lat: 21.0, lon: 95.0 },    // Myanmar
  ZW: { lat: -20.0, lon: 30.0 },   // Zimbabwe (lithium)
  CL: { lat: -30.0, lon: -71.0 },  // Chile (lithium nationalization)
};

// -----------------------------------
// Indigenous peoples / territory centroids (Expanded)
// -----------------------------------
const INDIGENOUS_COORDS: Record<string, { lat: number; lon: number }> = {
  "Balama communities": { lat: -13.3, lon: 38.6 },
  "Cabo Delgado communities": { lat: -12.8, lon: 39.2 },
  "Yukon First Nations": { lat: 62.5, lon: -135.0 },
  "Amazon forest communities": { lat: -9.1, lon: -70.3 },
  "Sámi": { lat: 68.2, lon: 20.0 },
  "Baloch communities": { lat: 28.5, lon: 66.0 },
  "Sahel Indigenous Groups": { lat: 16.0, lon: -2.0 }, // Mali/Niger/Burkina
  "Myanmar Kachin Communities": { lat: 26.0, lon: 97.5 }, // Rare earth conflicts
  "Zimbabwe Indigenous Miners": { lat: -19.0, lon: 29.5 }, // Lithium artisanal
};

// -----------------------------------
// Threat corridors (FPIC risk pathways) - Expanded with real intel
// -----------------------------------
const THREAT_CORRIDORS: ThreatCorridor[] = [
  {
    id: "moz-eu-graphite",
    from: "MZ",
    to: "SE",
    intensity: "high",
    label: "Balama graphite → EU cathode supply",
  },
  {
    id: "br-eu-grid",
    from: "BR",
    to: "SE",
    intensity: "medium",
    label: "Amazon grid expansions → EU demand",
  },
  {
    id: "cd-eu-cobalt",
    from: "CD",
    to: "SE",
    intensity: "high",
    label: "DRC cobalt → European OEMs",
  },
  {
    id: "ca-eu-critical",
    from: "CA",
    to: "SE",
    intensity: "medium",
    label: "Yukon critical minerals → EU supply chain",
  },
  {
    id: "pk-cn-corridor",
    from: "PK",
    to: "CN",
    intensity: "high",
    label: "Balochistan corridor → Chinese refining hubs",
  },
  // New Champions League corridors from X/Web intel
  {
    id: "cn-global-ree",
    from: "CN",
    to: "EU",
    intensity: "high",
    label: "China REE export veto → Global EV/AI disruption",
  },
  {
    id: "ml-sahel-gold",
    from: "ML",
    to: "EU",
    intensity: "high",
    label: "Sahel junta nationalization → Uranium/cobalt flows",
  },
  {
    id: "in-domestic-ree",
    from: "IN",
    to: "IN",
    intensity: "medium",
    label: "India refining gaps → Domestic EV exposure",
  },
  {
    id: "id-nickel-ban",
    from: "ID",
    to: "EU",
    intensity: "medium",
    label: "Indonesia nickel export ban → Battery chain shock",
  },
  {
    id: "mm-china-ree",
    from: "MM",
    to: "CN",
    intensity: "high",
    label: "Myanmar civil war → China REE feedstock cutoff",
  },
  {
    id: "zw-lithium-ban",
    from: "ZW",
    to: "EU",
    intensity: "medium",
    label: "Zimbabwe unprocessed lithium ban → Global processing",
  },
];

// -----------------------------------
// Convert lat/lon → image x/y (equirectangular)
// -----------------------------------
function project(lat: number, lon: number) {
  const x = ((lon + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return { x, y };
}

// -----------------------------------
// Get coordinates for a marker (indigenous-first)
// -----------------------------------
function coordsForMarker(m: MapMarker) {
  if (m.peopleName && INDIGENOUS_COORDS[m.peopleName]) {
    const { lat, lon } = INDIGENOUS_COORDS[m.peopleName];
    return project(lat, lon);
  }

  const c = COUNTRY_COORDS[m.countryCode];
  if (!c) return null;
  return project(c.lat, c.lon);
}

// -----------------------------------
// Marker colour based on type
// -----------------------------------
function markerColour(type: string) {
  switch (type) {
    case "supplier":
      return "bg-emerald-400 shadow-emerald-400/50";
    case "signal":
      return "bg-amber-400 shadow-amber-400/50";
    case "indigenous":
      return "bg-sky-400 shadow-sky-400/50";
    default:
      return "bg-slate-300";
  }
}

// -----------------------------------
// Risk ring colour based on intensity
// -----------------------------------
function ringColour(intensity: string) {
  switch (intensity) {
    case "high":
      return "border-rose-400 shadow-rose-400/30";
    case "medium":
      return "border-amber-300 shadow-amber-300/30";
    case "low":
      return "border-emerald-300 shadow-emerald-300/30";
    default:
      return "border-slate-400";
  }
}

// -----------------------------------
// Marker pulse animation based on intensity
// -----------------------------------
function markerPulse(intensity: string) {
  if (intensity === "high") return "animate-ping scale-[2.5] opacity-60";
  if (intensity === "medium") return "animate-ping scale-[2.0] opacity-40";
  return "animate-ping scale-[1.5] opacity-25";
}

// -----------------------------------
// Corridor colour based on intensity
// -----------------------------------
function corridorColour(intensity: "low" | "medium" | "high") {
  switch (intensity) {
    case "high":
      return "bg-rose-500/22";
    case "medium":
      return "bg-amber-400/18";
    case "low":
      return "bg-emerald-400/14";
  }
}

// -----------------------------------
// Component
// -----------------------------------
export default function WorldMap({ markers, onSelectCountry }: Props) {
  const [hoveredMarker, setHoveredMarker] = useState<MapMarker | null>(null);

  return (
    <div className="relative w-full h-[480px] md:h-[620px] rounded-xl overflow-hidden bg-black border border-slate-800 shadow-lg">
      {/* WORLD MAP IMAGE */}
      <Image
        src="/world-map-dark.png"
        alt="Global FPIC & Political Risk Map"
        fill
        className="object-cover opacity-90"
        priority
      />

      {/* THREAT CORRIDORS – FPIC risk pathways */}
      <div className="pointer-events-none absolute inset-0">
        {THREAT_CORRIDORS.map((c) => {
          const from = COUNTRY_COORDS[c.from];
          const to = COUNTRY_COORDS[c.to];
          if (!from || !to) return null;

          const p1 = project(from.lat, from.lon);
          const p2 = project(to.lat, to.lon);

          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          const angle = Math.atan2(dy, dx) * (180 / Math.PI);

          return (
            <div
              key={c.id}
              className={`absolute rounded-full blur-3xl ${corridorColour(
                c.intensity
              )} animate-pulse`}
              style={{
                left: `${midX}%`,
                top: `${midY}%`,
                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                width: `${distance * 1.1}%`,
                height: "16%",
                animationDuration: "4s",
              }}
              title={c.label}
            />
          );
        })}
      </div>

      {/* HEAT OVERLAY for high-risk points */}
      <div className="pointer-events-none absolute inset-0">
        {markers
          .filter((m) => m.intensity === "high")
          .map((m) => {
            const pos = coordsForMarker(m);
            if (!pos) return null;
            return (
              <div
                key={`heat-${m.id}`}
                className="absolute h-24 w-24 rounded-full bg-rose-500/15 blur-2xl animate-pulse"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: "translate(-50%, -50%)",
                  animationDuration: "3s",
                }}
              />
            );
          })}
      </div>

      {/* MARKERS */}
      {markers.map((m) => {
        const pos = coordsForMarker(m);
        if (!pos) return null;

        return (
          <div
            key={m.id}
            className="absolute group"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Outer glow */}
            <span
              className={`absolute h-4 w-4 rounded-full ${markerColour(
                m.type
              )} ${markerPulse(m.intensity)}`}
            />

            {/* Risk ring */}
            <div
              className={`absolute h-6 w-6 rounded-full border-2 ${ringColour(
                m.intensity
              )} shadow-lg`}
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />

            {/* Solid dot */}
            <button
              className={`relative z-10 h-3 w-3 rounded-full ${markerColour(
                m.type
              )} shadow-md hover:scale-125 transition-transform focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-950`}
              onClick={() => onSelectCountry?.(m.countryCode)}
              onMouseEnter={() => setHoveredMarker(m)}
              onMouseLeave={() => setHoveredMarker(null)}
              onFocus={() => setHoveredMarker(m)}
              onBlur={() => setHoveredMarker(null)}
              aria-label={`${m.peopleName || m.label} - ${m.type} marker in ${
                m.countryCode
              }, ${m.intensity} risk`}
            />

            {/* Tooltip – FPIC / Indigenous / AI forecast */}
            {hoveredMarker?.id === m.id && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 opacity-100 transition-opacity pointer-events-none z-20">
                <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap border border-slate-700">
                  <p className="font-semibold">
                    {m.peopleName ?? m.label}
                  </p>
                  {m.territoryName && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {m.territoryName}
                    </p>
                  )}
                  <p className="text-[10px] text-rose-200 mt-1">
                    🔥 AI-analyzed FPIC risk:{" "}
                    <span className="capitalize font-medium">
                      {m.intensity}
                    </span>
                    {m.forecastHorizonYears
                      ? ` over ${m.forecastHorizonYears} yr`
                      : ""}
                  </p>
                  {m.riskCategory && (
                    <p className="text-[9px] text-slate-500 mt-0.5 capitalize">
                      {m.riskCategory} risk
                    </p>
                  )}
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-slate-900" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
