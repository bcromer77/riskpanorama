// components/bapa/CityIntelCard.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Risk = { type: string; headline: string; impact?: string; window?: string; severity: "High" | "Medium" | "Low" };
type Delivery = { store: string; total_qty: number; last_delivery: string; samples: Array<{ sku: string; qty: number; at: string }> };
type FleetItem = { city: string; fleet: string; material: string; component: string; share: number };

export default function CityIntelCard({
  city,
  risks,
  deliveries,
  fleet,
  docs,
  guidance,
  onExport
}: {
  city: string;
  risks: Risk[];
  deliveries: Delivery[];
  fleet: FleetItem[];
  docs: Array<{ filename: string; summary?: string; score?: number }>;
  guidance: string[];
  onExport?: () => void;
}) {
  return (
    <Card className="border-emerald-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{city} — City Intelligence</CardTitle>
        <div className="flex gap-2">
          <Badge variant="outline" className="border-emerald-300 text-emerald-700">{risks.length} signals</Badge>
          <Badge variant="outline" className="border-sky-300 text-sky-700">{deliveries.length} stores</Badge>
          <Badge variant="outline" className="border-amber-300 text-amber-700">{fleet.length} fleet items</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risks */}
        <section>
          <h3 className="font-medium text-gray-800 mb-2">Infrastructure & Policy Signals</h3>
          <ul className="space-y-2">
            {risks.map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <Badge className={r.severity === "High" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}>
                  {r.type}
                </Badge>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{r.headline}</div>
                  <div className="text-gray-600">{r.impact} {r.window ? `• ${r.window}` : ""}</div>
                </div>
              </li>
            ))}
            {risks.length === 0 && <div className="text-sm text-gray-500">No active city signals.</div>}
          </ul>
        </section>

        {/* Deliveries */}
        <section>
          <h3 className="font-medium text-gray-800 mb-2">Stores Delivered (last 2 quarters)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {deliveries.map((d, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="font-medium text-gray-900">{d.store}</div>
                <div className="text-sm text-gray-600">Total qty: {d.total_qty} • Last: {new Date(d.last_delivery).toLocaleDateString()}</div>
                <ul className="mt-1 text-xs text-gray-600 list-disc pl-4">
                  {d.samples.map((s, idx) => (
                    <li key={idx}>{s.sku} — {s.qty} ({new Date(s.at).toLocaleDateString()})</li>
                  ))}
                </ul>
              </div>
            ))}
            {deliveries.length === 0 && <div className="text-sm text-gray-500">No deliveries recorded in the period.</div>}
          </div>
        </section>

        {/* Fleet / Materials */}
        <section>
          <h3 className="font-medium text-gray-800 mb-2">Fleet & Material Exposure</h3>
          <ul className="space-y-1 text-sm">
            {fleet.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <Badge variant="outline" className="border-purple-300 text-purple-700">Fleet</Badge>
                <span className="text-gray-800">{f.fleet}</span>
                <span className="text-gray-600">— {f.material} in {f.component} ({Math.round(f.share * 100)}%)</span>
              </li>
            ))}
            {fleet.length === 0 && <div className="text-sm text-gray-500">No local fleet/material mappings yet.</div>}
          </ul>
        </section>

        {/* Context Docs */}
        <section>
          <h3 className="font-medium text-gray-800 mb-2">Relevant Documents</h3>
          <ul className="space-y-1">
            {docs.map((d, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium text-gray-900">{d.filename}</span>
                {d.summary ? <span className="text-gray-600"> — {d.summary}</span> : null}
                {typeof d.score === "number" ? <span className="ml-2 text-xs text-gray-500">score {d.score.toFixed(3)}</span> : null}
              </li>
            ))}
            {docs.length === 0 && <div className="text-sm text-gray-500">Upload a PDF to enrich city context.</div>}
          </ul>
        </section>

        {/* Guidance */}
        <section>
          <h3 className="font-medium text-gray-800 mb-2">Actionable Guidance</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800">
            {guidance.map((g, i) => <li key={i}>{g}</li>)}
            {guidance.length === 0 && <div className="text-sm text-gray-500">No special guidance this week.</div>}
          </ul>
        </section>

        <div className="pt-2">
          <Button onClick={onExport} className="bg-emerald-600 hover:bg-emerald-700">
            Export City Report (PDF)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

