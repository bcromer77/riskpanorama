// app/page.tsx

"use client";

import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 text-slate-900">
      {/* Navigation bar placeholder (already in layout) */}

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        <h1 className="text-5xl md:text-6xl font-light mb-6 leading-tight">
          Know What’s Real — <br className="hidden md:block" /> From Shelf to Source.
        </h1>
        <p className="text-xl text-slate-600 mb-10 leading-relaxed">
          Veracity 101 gives you <span className="font-semibold text-emerald-700">proof of provenance</span> 
          across minerals, medicine, food, and ESG — connecting every SKU backwards to its origin.
        </p>

        <div className="flex justify-center">
          <Button
            onClick={() => (window.location.href = "/upload")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg rounded-full shadow-lg"
          >
            Check a Product
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <p className="text-sm text-slate-500 mt-4">
          No login • 3 free checks • Powered by MongoDB Atlas + Voyage AI
        </p>
      </section>

      {/* Veracity Categories */}
      <section className="max-w-5xl mx-auto px-6 py-12 border-t border-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: "⛰️", title: "Minerals", score: 88 },
            { icon: "💊", title: "Pharma APIs", score: 92 },
            { icon: "🌾", title: "Food & Agri", score: 94 },
            { icon: "⚖️", title: "Legal / ESG", score: 90 },
          ].map((c) => (
            <Card key={c.title} className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="py-8">
                <div className="text-4xl mb-3">{c.icon}</div>
                <div className="font-medium text-slate-900">{c.title}</div>
                <div className="text-sm text-slate-500 mt-1">Veracity Score: {c.score}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Mission Statement */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-light mb-6">
          Every Product Should Carry Its Proof of Truth.
        </h2>
        <p className="text-lg text-slate-600 leading-relaxed mb-8">
          We help retailers, engineers, and ESG officers connect documentation to reality — 
          so you never have to guess what’s inside your supply chain again.
        </p>
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/suppliers")}
          className="px-8 py-5 text-base border-slate-300 hover:bg-slate-50"
        >
          View Verified Suppliers
        </Button>
      </section>

      {/* Why It Matters */}
      <section className="bg-slate-50 border-t border-slate-200 py-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8 text-left">
          {[
            {
              icon: <ShieldCheck className="h-6 w-6 text-emerald-600" />,
              title: "For General Counsel",
              desc: "Avoid €40 M recalls by spotting non-compliant SKUs before they reach the shelves."
            },
            {
              icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
              title: "For Supply Chain Teams",
              desc: "See which of your 100+ suppliers are exposing you to ESG, safety, or compliance risk."
            },
            {
              icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
              title: "For ESG Officers",
              desc: "Automate traceability across battery passports, carbon, and human-rights reporting."
            },
          ].map((x) => (
            <Card key={x.title} className="bg-white shadow-sm hover:shadow-md transition">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">{x.icon}<h3 className="font-medium text-slate-900">{x.title}</h3></div>
                <p className="text-sm text-slate-600 leading-relaxed">{x.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center border-t border-slate-200">
        <p className="text-sm text-slate-500 mb-6 uppercase tracking-wide">Trusted By</p>
        <div className="flex items-center justify-center gap-12 text-slate-400 text-2xl opacity-70 font-light">
          <span>Major EU Retailer</span>
          <span>Supply Chain Co.</span>
          <span>Battery Manufacturer</span>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-indigo-600 to-emerald-600 text-white text-center py-20">
        <h2 className="text-4xl font-light mb-6">From Shelf to Source Starts Here.</h2>
        <p className="text-lg opacity-90 mb-8">Join the teams turning chaos into traceability.</p>
        <Button
          size="lg"
          className="bg-white text-emerald-700 hover:bg-slate-50 px-8 py-6 text-lg rounded-full"
          onClick={() => (window.location.href = "/upload")}
        >
          Check Your First Document
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </section>
    </div>
  );
}

