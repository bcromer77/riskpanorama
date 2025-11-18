"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";

/**
 * Public Battery Passport Viewer (fullscreen QR)
 * Compatible with Next.js 15.5+ (unwrap params Promise via React.use)
 * Uses /api/passport/[id]?role=public
 */
export default function PassportPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next.js 15.5 – params is a Promise
  const { id } = use(params);
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [qr, setQr] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const resp = await fetch(`/api/passport/${id}?role=public`, {
          cache: "no-store",
        });
        if (!resp.ok) {
          const j = await resp.json().catch(() => ({}));
          throw new Error(j.error || `Failed with ${resp.status}`);
        }
        const json = await resp.json();
        setData(json);

        const url =
          typeof window !== "undefined"
            ? window.location.href
            : `https://www.rareearthminerals.ai/passport/${id}`;

        const png = await QRCode.toDataURL(url, {
          margin: 1,
          width: 480,
        });
        setQr(png);
      } catch (err: any) {
        console.error("Failed to load passport:", err);
        setError(err.message || "Failed to load passport");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading passport…</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="max-w-md rounded-2xl border border-rose-500/40 bg-rose-500/10 px-6 py-4">
          <p className="text-sm text-rose-100 mb-1">
            We couldn’t load this passport.
          </p>
          <p className="text-xs text-rose-200/80">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-3 inline-flex items-center rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-800"
          >
            ← Back
          </button>
        </div>
      </main>
    );
  }

  const pp = data.passport || {};
  const doc = data.document || {};

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-xs font-semibold tracking-tight">
              REM
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-slate-50">
                Battery Passport
              </h1>
              <p className="text-xs text-slate-400">
                Public view — safe to share with authorities, OEMs, retailers
                and tribes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/vault")}
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-800"
            >
              ← Back to Vault
            </button>
            <button
              onClick={() => window.print()}
              className="rounded-md border border-slate-600 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-white"
            >
              Download / Print
            </button>
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="mx-auto max-w-5xl px-4 py-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)] items-start">
        {/* LEFT – Big QR + headline */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col items-center justify-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-2">
              Scan to verify
            </p>

            {qr && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qr}
                alt="Battery Passport QR"
                className="w-56 h-56 rounded-xl bg-white p-2 shadow-[0_0_40px_rgba(16,185,129,0.25)]"
              />
            )}

            <p className="mt-3 text-xs text-slate-300 text-center max-w-xs">
              This QR links back to the same immutable passport JSON — suitable
              for labels, SDS appendices and retailer portals.
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-500/60 text-[10px]">
                Article 13 · Digital Passport
              </Badge>
              {pp.country && (
                <Badge className="bg-slate-800 text-[10px] text-slate-200">
                  Country of placing on market: {pp.country}
                </Badge>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
            <h2 className="text-sm font-semibold text-slate-50">
              Passport ID & operator
            </h2>
            <p className="text-xs text-slate-300 space-y-1">
              <span className="block">
                <span className="font-medium text-slate-200">Passport ID:</span>{" "}
                <span className="font-mono text-slate-300">{id}</span>
              </span>
              {pp.battery_id && (
                <span className="block">
                  <span className="font-medium text-slate-200">
                    Battery ID:
                  </span>{" "}
                  {pp.battery_id}
                </span>
              )}
              {pp.category && (
                <span className="block">
                  <span className="font-medium text-slate-200">
                    Category:
                  </span>{" "}
                  {pp.category}
                </span>
              )}
              {pp.operator?.name && (
                <span className="block">
                  <span className="font-medium text-slate-200">
                    Operator:
                  </span>{" "}
                  {pp.operator.name}{" "}
                  {pp.operator.role && `(${pp.operator.role})`}
                </span>
              )}
            </p>
          </div>
        </section>

        {/* RIGHT – Carbon, due diligence, meta */}
        <section className="space-y-4">
          {/* Carbon footprint */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-50">
                Carbon footprint (Art. 7)
              </h2>
              {pp.carbon_footprint?.performance_class && (
                <Badge className="bg-emerald-500/15 text-emerald-200 border border-emerald-500/50 text-[10px]">
                  Class {pp.carbon_footprint.performance_class}
                </Badge>
              )}
            </div>

            <p className="text-sm text-slate-100">
              {pp.carbon_footprint?.total_gco2_per_kWh != null ? (
                <>
                  <span className="text-2xl font-semibold text-emerald-300">
                    {pp.carbon_footprint.total_gco2_per_kWh}
                  </span>{" "}
                  <span className="text-xs text-slate-400">gCO₂/kWh</span>
                </>
              ) : (
                <span className="text-xs text-slate-400">
                  No public carbon footprint value recorded.
                </span>
              )}
            </p>

            {pp.carbon_footprint?.study_url && (
              <a
                href={pp.carbon_footprint.study_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs text-emerald-300 hover:underline"
              >
                View underlying LCA / study
              </a>
            )}
          </div>

          {/* Due diligence */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-50">
              Due diligence (Art. 8)
            </h2>
            {pp.due_diligence?.report_url ? (
              <a
                href={pp.due_diligence.report_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs text-emerald-300 hover:underline"
              >
                Public due diligence report
              </a>
            ) : (
              <p className="text-xs text-slate-400">
                No public report URL attached for this passport.
              </p>
            )}
          </div>

          {/* Meta / source */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
            <h2 className="text-sm font-semibold text-slate-50">
              Source document & JSON
            </h2>
            {doc.filename && (
              <p className="text-xs text-slate-300">
                <span className="font-medium text-slate-200">Source PDF:</span>{" "}
                {doc.filename}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={`/api/passport/${id}?role=public`}
                target="_blank"
                className="inline-flex items-center rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-100 hover:bg-slate-900"
              >
                View raw JSON
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

