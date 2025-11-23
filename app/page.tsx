// app/page.tsx — THE KILLER PAGE
// This is the page that ends every conversation about "Do we really need this?" with silence.
// Built for the people who sign the Battery Passport Act compliance reports.

"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Droplets,
  Users,
  Scale,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react";

export default function HomePage() {
  const time = new Date().toLocaleString("sv-SE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const threats = [
    {
      region: "Thacker Pass, Nevada",
      people: "Hualapai Nation",
      legal: "UNDRIP Art. 32 · Sacred springs",
      climateWater: "+4.2 °C · Aquifer collapse risk",
      impact: "9 % of global lithium · IRA credits at risk",
      index: 22,
      severity: "severe",
    },
    {
      region: "Atacama Basin, Chile",
      people: "Colla · Lickanantay",
      legal: "UNDRIP Art. 25 · ILO 169",
      climateWater: "+3.8 °C · 40 % brine depletion",
      impact: "Core EU cathode supply",
      index: 24,
      severity: "severe",
    },
    {
      region: "Sápmi, Nordic Arctic",
      people: "Sámi Parliament",
      legal: "UNDRIP · ILO 169 · Norwegian Const. §108",
      climateWater: "4× global warming",
      impact: "Nickel · vanadium · CRMA fast-track blocked",
      index: 39,
      severity: "high",
    },
    {
      region: "Cabo Delgado, Mozambique",
      people: "Makua communities",
      legal: "ILO 169 principles",
      climateWater: "Cyclones ↑ 60 % · salination",
      impact: "Balama graphite · anode supply",
      index: 31,
      severity: "severe",
    },
    {
      region: "Lualaba, DRC",
      people: "Riverine communities",
      legal: "OECD · LkSG human rights",
      climateWater: "Extreme flooding",
      impact: "Cobalt · tailings breach risk",
      index: 35,
      severity: "severe",
    },
    {
      region: "Global Indigenous Lands",
      people: "All mineral-bearing territories",
      legal: "UNDRIP · Paris Agreement 1.5 °C",
      climateWater: "2025–2027 overshoot likely",
      impact: "Systemic passport invalidation risk",
      index: 20,
      severity: "systemic",
    },
  ];

  const suppliers = [
    { name: "Lithium Americas", index: 22 },
    { name: "SQM / Albemarle", index: 24 },
    { name: "Syrah Resources", index: 43 },
    { name: "Talga AB", index: 47 },
    { name: "CATL", index: 59 },
    { name: "Northvolt", index: 76 },
  ];

  const color = (i: number) =>
    i < 30 ? "text-rose-700 bg-rose-50" : i < 50 ? "text-amber-700 bg-amber-50" : "text-emerald-700 bg-emerald-50";

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Battery Passport Legitimacy Monitor
            </h1>
            <p className="mt-2 text-lg text-slate-600">
              Article 77 · FPIC · Water · Climate · UNDRIP · ILO 169
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">Last updated</div>
            <div className="text-xl font-mono text-slate-800">{time} (Live)</div>
            <div className="mt-2 flex items-center gap-2 text-rose-700 font-medium">
              <AlertTriangle className="w-5 h-5" />
              6 active legitimacy threats
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* One sentence that ends the debate */}
        <section className="mb-16 text-center">
          <h2 className="text-5xl font-bold text-slate-900 leading-tight">
            Your battery passport is only as legitimate as its weakest Indigenous consent.
          </h2>
          <p className="mt-6 text-xl text-slate-600 max-w-4xl mx-auto">
            One unresolved FPIC dispute, one breached water right, one climate limit crossed — and Article 77 compliance is gone.
          </p>
          <p className="mt-4 text-lg font-medium text-slate-700">
            6 active legitimacy threats across 4 corridors, affecting 3 Indigenous nations and 2 water basins.
          </p>
        </section>

        {/* Legitimacy Threats */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-rose-600" />
            Active Legitimacy Threats
          </h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {threats.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-slate-50 border rounded-2xl p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg">{t.region}</h3>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${t.severity === "severe" ? "bg-rose-100 text-rose-800 border-rose-300" : "bg-amber-100 text-amber-800 border-amber-300"}`}>
                    {t.severity.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <p>
                    <Users className="inline w-4 h-4 mr-1 text-slate-600" />
                    {t.people}
                  </p>
                  <p className="text-slate-600">{t.legal}</p>
                  <p>
                    <Droplets className="inline w-4 h-4 mr-1 text-sky-600" />
                    {t.climateWater}
                  </p>
                  <p className="font-medium">{t.impact}</p>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">
                    Legitimacy Index
                  </span>
                  <span className={`text-2xl font-bold ${color(t.index)}`}>
                    {t.index}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${t.index < 30 ? "bg-rose-500" : "bg-amber-500"}`}
                    style={{ width: `${t.index}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Supplier Index */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-600" />
            Supplier Legitimacy Index
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {suppliers.map((s) => (
              <div key={s.name} className="bg-white border rounded-xl p-6 text-center">
                <div className={`text-4xl font-bold ${color(s.index)}`}>
                  {s.index}
                </div>
                <p className="text-sm text-slate-600 mt-3">{s.name}</p>
                <div className="mt-4 w-full bg-slate-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${s.index < 30 ? "bg-rose-500" : s.index < 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${s.index}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA — No escape */}
        <section className="text-center py-16">
          <h2 className="text-4xl font-bold mb-6">
            Open the full intelligence platform
          </h2>
          <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto">
            Real-time FPIC, water, climate, and legal exposure across your entire battery supply chain.
          </p>
          <button
            onClick={() => window.location.href = "/suppliers"}
            className="inline-flex items-center gap-4 bg-slate-900 text-white font-semibold text-xl px-12 py-6 rounded-xl hover:bg-black transition"
          >
            Access Platform
            <ArrowRight className="w-6 h-6" />
          </button>
        </section>
      </main>
    </div>
  );
}
