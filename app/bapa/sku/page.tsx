"use client";

import React, { useEffect, useMemo, useState } from "react";

type ComplianceReport = {
  sku: string;
  brand?: string;
  region?: string;
  framework?: string;
  battery_risk_score: number; // 0..100
  consumer_safety: {
    cathode_overhang_defects_pct?: number;
    edge_alignment_variance_pct?: number;
    capacity_gap_pct?: number;
    negative_anode_overhang_pct?: number;
    notes?: string[];
  };
  esg_provenance: {
    graphite_origin?: string;
    esg_risk_level?: "Low" | "Medium" | "High";
    reputation_note?: string;
  };
  battery_passport?: {
    traceability_missing?: boolean;
    recycled_content_missing?: boolean;
    manufacturer_id_missing?: boolean;
  };
  classification: string;
  meaning: string;
};

type DeliveryRow = {
  store_id: string;
  store_name?: string;
  last_delivery: string; // ISO date
  total_qty: number;
};

const BADGE = (score: number) => {
  if (score >= 80) return { txt: "High", cls: "bg-rose-50 text-rose-700" };
  if (score >= 50) return { txt: "Medium", cls: "bg-amber-50 text-amber-700" };
  return { txt: "Low", cls: "bg-emerald-50 text-emerald-700" };
};

export default function SkuScannerPage() {
  const [sku, setSku] = useState("Benkia 18650 9900mAh");
  const [brand, setBrand] = useState("");
  const [region, setRegion] = useState<"eu" | "us" | "cn" | "mx" | "jp" | "">("");
  const [framework, setFramework] = useState<
    | ""
    | "battery_passport"
    | "esg_due_diligence"
    | "right_to_repair"
    | "cpsc"
    | "tsa"
  >("");

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  const regionLabel = useMemo(() => {
    const map: Record<string, string> = {
      eu: "European Union",
      us: "United States",
      cn: "China",
      mx: "Mexico",
      jp: "Japan",
    };
    return region ? map[region] : "Global";
  }, [region]);

  const frameworkLabel = useMemo(() => {
    const map: Record<string, string> = {
      battery_passport: "EU Battery Passport (2023/1542)",
      esg_due_diligence: "EU Corporate Sustainability Due Diligence",
      right_to_repair: "EU Right-to-Repair",
      cpsc: "US CPSC (Consumer Product Safety)",
      tsa: "US TSA/FAA Lithium Transport",
    };
    return framework ? map[framework] : "All frameworks";
  }, [framework]);

  async function scan() {
    setLoading(true);
    try {
      const res = await fetch("/api/bapa/sku/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, brand, region, framework }),
      });
      const json = await res.json();
      if (json.success) setReport(json.report);
      else setReport(null);
    } catch (e) {
      console.error(e);
      setReport(null);
    } finally {
      setLoading(false);
    }

    setLoadingDeliveries(true);
    try {
      const res = await fetch("/api/bapa/sku/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, lookback_quarters: 2 }),
      });
      const json = await res.json();
      if (json.success) setDeliveries(json.rows || []);
      else setDeliveries([]);
    } catch (e) {
      console.error(e);
      setDeliveries([]);
    } finally {
      setLoadingDeliveries(false);
    }
  }

  function openPdf() {
    const url = `/api/bapa/sku/export?sku=${encodeURIComponent(
      sku
    )}&brand=${encodeURIComponent(brand || "")}&region=${encodeURIComponent(
      region || ""
    )}&framework=${encodeURIComponent(framework || "")}`;
    window.open(url, "_blank");
  }

  useEffect(() => {
    // first render demo
    scan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">🔍</span>
        <h1 className="text-2xl font-semibold">SKU Compliance Scanner</h1>
      </div>

      {/* Inputs Row */}
      <div className="flex flex-wrap gap-3">
        <input
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          className="flex-1 min-w-[280px] rounded-xl border border-emerald-200 px-4 py-3 focus:outline-none focus:ring-2 ring-emerald-200"
          placeholder="Enter SKU (e.g., Benkia 18650 9900mAh)"
        />
        <input
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="w-[240px] rounded-xl border border-emerald-200 px-4 py-3 focus:outline-none focus:ring-2 ring-emerald-200"
          placeholder="Brand (optional)"
        />
        {/* Region / Framework selectors */}
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value as any)}
          className="w-[220px] rounded-xl border border-emerald-200 px-3 py-3 bg-white"
        >
          <option value="">Region (All)</option>
          <option value="eu">🇪🇺 European Union</option>
          <option value="us">🇺🇸 United States</option>
          <option value="cn">🇨🇳 China</option>
          <option value="mx">🇲🇽 Mexico</option>
          <option value="jp">🇯🇵 Japan</option>
        </select>
        <select
          value={framework}
          onChange={(e) => setFramework(e.target.value as any)}
          className="w-[280px] rounded-xl border border-emerald-200 px-3 py-3 bg-white"
        >
          <option value="">Framework (All)</option>
          <option value="battery_passport">🔋 EU Battery Passport</option>
          <option value="esg_due_diligence">
            🌍 EU Corporate Sustainability DD
          </option>
          <option value="right_to_repair">🔧 EU Right-to-Repair</option>
          <option value="cpsc">⚖️ US CPSC</option>
          <option value="tsa">✈️ US TSA/FAA Lithium</option>
        </select>

        <button
          onClick={scan}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3"
        >
          {loading ? "Scanning…" : "Scan"}
        </button>
      </div>

      {/* Summary strip */}
      <div className="text-sm text-gray-600">
        Context: <span className="font-medium">{regionLabel}</span> •{" "}
        <span className="font-medium">{frameworkLabel}</span>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: SKU summary + risk dial */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-5">
          <div className="text-xs uppercase tracking-wide text-gray-500">
            SKU
          </div>
          <div className="mt-1 text-lg font-semibold">{sku || "—"}</div>
          {brand && <div className="text-gray-500">{brand}</div>}

          <div className="mt-6 flex items-center gap-6">
            {/* Dial (CSS only) */}
            <div className="relative w-24 h-24 grid place-items-center">
              <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                <path
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3.8"
                />
                <path
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831"
                  fill="none"
                  stroke={
                    report && report.battery_risk_score >= 80
                      ? "#e11d48"
                      : report && report.battery_risk_score >= 50
                      ? "#f59e0b"
                      : "#10b981"
                  }
                  strokeDasharray={`${(report?.battery_risk_score || 0) * 0.44}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.8"
                />
              </svg>
              <div className="absolute text-center">
                <div className="text-[11px] text-gray-500">Battery Risk</div>
                <div className="text-2xl font-bold">
                  {Math.round(report?.battery_risk_score ?? 0)}
                </div>
              </div>
            </div>

            {/* Risk drivers */}
            <div className="text-sm text-gray-700">
              <div className="font-medium mb-1">Risk drivers:</div>
              <ul className="list-disc ml-4 space-y-1">
                {report?.consumer_safety?.cathode_overhang_defects_pct != null && (
                  <li>
                    Cathode overhang defects ~
                    {report.consumer_safety.cathode_overhang_defects_pct}% of
                    sampled cells
                  </li>
                )}
                {report?.consumer_safety?.edge_alignment_variance_pct != null && (
                  <li>
                    Edge alignment variance{" "}
                    {report.consumer_safety.edge_alignment_variance_pct}%
                  </li>
                )}
                {report?.consumer_safety?.capacity_gap_pct != null && (
                  <li>Capacity gap {report.consumer_safety.capacity_gap_pct}%</li>
                )}
                {report?.esg_provenance?.graphite_origin && (
                  <li>
                    Graphite origin: {report.esg_provenance.graphite_origin}
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* PDF button */}
          <button
            onClick={openPdf}
            className="mt-6 w-full rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-4 py-3"
          >
            🧾 Generate Compliance Report (PDF)
          </button>
        </div>

        {/* Middle: Compliance tab */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-0 overflow-hidden lg:col-span-1">
          <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
            <div className="font-semibold">Compliance</div>
            <span
              className={`text-xs rounded px-2 py-0.5 ${BADGE(
                report?.battery_risk_score || 0
              ).cls}`}
            >
              Risk: {BADGE(report?.battery_risk_score || 0).txt}
            </span>
          </div>

          <div className="p-5 grid grid-cols-1 gap-5">
            {/* Consumer Safety mini-bars */}
            <div>
              <div className="text-sm font-semibold mb-2">Consumer Safety</div>
              {[
                {
                  label: "Cathode overhang defects",
                  v: report?.consumer_safety?.cathode_overhang_defects_pct ?? 0,
                },
                {
                  label: "Edge alignment variance",
                  v: report?.consumer_safety?.edge_alignment_variance_pct ?? 0,
                },
                {
                  label: "Capacity gap (risk)",
                  v: report?.consumer_safety?.capacity_gap_pct ?? 0,
                },
                {
                  label: "Negative anode overhang",
                  v: report?.consumer_safety?.negative_anode_overhang_pct ?? 0,
                },
              ].map((row) => (
                <div key={row.label} className="mb-2">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{row.label}</span>
                    <span>{row.v}%</span>
                  </div>
                  <div className="h-2 rounded bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full ${
                        row.v >= 80
                          ? "bg-rose-500"
                          : row.v >= 50
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${row.v}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* ESG & Provenance */}
            <div className="pt-1 border-t border-gray-100">
              <div className="text-sm font-semibold mb-2">ESG & Provenance</div>
              <div className="text-sm text-gray-700 space-y-1">
                {report?.esg_provenance?.graphite_origin && (
                  <div>
                    <span className="text-gray-500">Graphite origin: </span>
                    <span>{report.esg_provenance.graphite_origin}</span>
                  </div>
                )}
                {report?.esg_provenance?.esg_risk_level && (
                  <div>
                    <span className="text-gray-500">ESG risk level: </span>
                    <span className="font-medium">
                      {report.esg_provenance.esg_risk_level}
                    </span>
                  </div>
                )}
                {report?.esg_provenance?.reputation_note && (
                  <div className="text-gray-600">
                    {report.esg_provenance.reputation_note}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Deliveries (last 2 quarters) */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-0 overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
            <div className="font-semibold">Stores Delivered (Last 2 Quarters)</div>
            <div className="text-xs text-gray-500">Auto-derived</div>
          </div>
          <div className="p-5 space-y-3">
            {loadingDeliveries && (
              <div className="text-sm text-gray-500">Loading deliveries…</div>
            )}
            {!loadingDeliveries && deliveries.length === 0 && (
              <div className="text-sm text-gray-500">
                No deliveries found in the last 2 quarters.
              </div>
            )}
            {deliveries.map((d) => (
              <div
                key={`${d.store_id}-${d.last_delivery}`}
                className="border border-gray-100 rounded-xl p-3 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-gray-800">
                    {d.store_name || d.store_id}
                  </div>
                  <div className="text-xs text-gray-500">
                    Last delivery: {new Date(d.last_delivery).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                  Qty: {d.total_qty}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Meaning / classification card */}
      {report && (
        <div className="rounded-2xl border border-emerald-100 bg-white p-5">
          <div className="text-sm text-emerald-700 font-semibold">
            {report.classification}
          </div>
          <div className="mt-1 text-gray-800">{report.meaning}</div>
        </div>
      )}
    </div>
  );
}

