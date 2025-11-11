"use client";

import { use, useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * Public Battery Passport Viewer
 * Compatible with Next.js 15.5+ (unwraps params Promise via React.use)
 * Shows QR, overview, carbon footprint, due diligence — public view only
 */
export default function PassportPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ Unwrap params safely for Next.js 15.5+
  const { id } = use(params);

  const [data, setData] = useState<any>(null);
  const [qr, setQr] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const resp = await fetch(`/api/passport/${id}?role=public`, {
          cache: "no-store",
        });
        const json = await resp.json();
        setData(json);

        const url =
          typeof window !== "undefined" ? window.location.href : "";
        const png = await QRCode.toDataURL(url, { margin: 1, width: 240 });
        setQr(png);
      } catch (err) {
        console.error("Failed to load passport:", err);
      }
    }
    load();
  }, [id]);

  if (!data) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-slate-500 text-sm">Loading passport…</p>
      </main>
    );
  }

  const pp = data.passport || {};

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Battery Passport
          </h1>
          <p className="text-sm text-slate-500">
            Public view — share with authorities, OEMs, and retailers.
          </p>
        </div>
        {qr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qr}
            alt="Passport QR"
            className="w-28 h-28 rounded-md border bg-white"
          />
        )}
      </header>

      {/* Overview Section */}
      <section className="bg-white border rounded-2xl p-6 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">Overview</h2>
        <div className="text-sm text-slate-700 space-y-1">
          <div>
            <span className="font-medium">Passport ID:</span> {id}
          </div>
          <div>
            <span className="font-medium">Battery ID:</span>{" "}
            {pp.battery_id || "—"}
          </div>
          <div>
            <span className="font-medium">Category:</span>{" "}
            {pp.category || "—"}
          </div>
          <div>
            <span className="font-medium">Operator:</span>{" "}
            {pp.operator?.name
              ? `${pp.operator.name} (${pp.operator.role || "operator"})`
              : "—"}
          </div>
          <div>
            <span className="font-medium">Country:</span>{" "}
            {pp.country || "—"}
          </div>
        </div>
      </section>

      {/* Carbon Footprint Section */}
      <section className="bg-white border rounded-2xl p-6 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">
          Carbon Footprint
        </h2>
        <div className="text-sm text-slate-700 space-y-1">
          <div>
            <span className="font-medium">Total:</span>{" "}
            {pp.carbon_footprint?.total_gco2_per_kWh ?? "—"} gCO₂/kWh
          </div>
          <div>
            <span className="font-medium">Class:</span>{" "}
            {pp.carbon_footprint?.performance_class ?? "—"}
          </div>
          {pp.carbon_footprint?.study_url && (
            <a
              href={pp.carbon_footprint.study_url}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 text-sm underline"
            >
              LCA / Study
            </a>
          )}
        </div>
      </section>

      {/* Due Diligence Section */}
      <section className="bg-white border rounded-2xl p-6 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">
          Due Diligence
        </h2>
        <div className="text-sm text-slate-700 space-y-1">
          {pp.due_diligence?.report_url ? (
            <a
              href={pp.due_diligence.report_url}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 underline"
            >
              Public Due Diligence Report
            </a>
          ) : (
            <span>—</span>
          )}
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800"
        >
          Download / Print
        </button>
        <a
          href={`/api/passport/${id}?role=public`}
          target="_blank"
          className="px-4 py-2 rounded-lg border text-sm hover:bg-slate-50"
        >
          View JSON
        </a>
      </div>
    </main>
  );
}

