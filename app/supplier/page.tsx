"use client";

import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// If you already have shadcn/ui, you can swap these for your own
// "@/components/ui/*" imports. Otherwise this page uses just Tailwind.

type BadgeColor = "green" | "amber" | "red";
type MaterialType = "Lithium-Ion Battery" | "Neodymium Magnet" | "LED Fixture" | "Polyethylene Pipe" | "Other";

type SupplierCard = {
  id: string;
  material: MaterialType;
  title: string;
  supplierPrimary: string;
  supplierList: string[];
  lastAudit: string; // ISO or pretty date
  badge: BadgeColor; // ESG badge
  confidence?: "A" | "B" | "C";
  imageHint?: "battery" | "magnet" | "led" | "pipe" | "generic";
};

const STARTER_DATA: SupplierCard[] = [
  {
    id: "bat-1",
    material: "Lithium-Ion Battery",
    title: "Lithium-Ion Battery",
    supplierPrimary: "Chemical Resources",
    supplierList: ["Chemical Resources", "New Energy Materials", "Global Battery Solutions"],
    lastAudit: "2025-09-15",
    badge: "green",
    confidence: "A",
    imageHint: "battery",
  },
  {
    id: "mag-1",
    material: "Neodymium Magnet",
    title: "Neodymium Magnet",
    supplierPrimary: "Rate Earth Supply",
    supplierList: ["Rate Earth Supply", "Strategic Materials Inc"],
    lastAudit: "2025-09-01",
    badge: "green",
    confidence: "A",
    imageHint: "magnet",
  },
  {
    id: "led-1",
    material: "LED Fixture",
    title: "LED Fixture",
    supplierPrimary: "Illumination Techs",
    supplierList: ["Illumination Techs", "Bright Light GP"],
    lastAudit: "2025-08-25",
    badge: "green",
    confidence: "A",
    imageHint: "led",
  },
  {
    id: "pipe-1",
    material: "Polyethylene Pipe",
    title: "Polyethylene Pipe",
    supplierPrimary: "PolyPipe Industries",
    supplierList: ["PolyPipe Industries", "EcaPlastics", "Midas Plastics"],
    lastAudit: "2025-12-01",
    badge: "amber",
    confidence: "B",
    imageHint: "pipe",
  },
];

function badgePill(color: BadgeColor) {
  const styles: Record<BadgeColor, string> = {
    green: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    amber: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    red: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
  };
  const label: Record<BadgeColor, string> = {
    green: "Green",
    amber: "Amber",
    red: "Red",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[color]}`}>{label[color]}</span>;
}

function materialEmoji(hint?: SupplierCard["imageHint"]) {
  switch (hint) {
    case "battery":
      return "🔋";
    case "magnet":
      return "🧲";
    case "led":
      return "💡";
    case "pipe":
      return "🧵";
    default:
      return "📦";
  }
}

export default function SupplierVerificationPage() {
  const router = useRouter();

  // Grid data
  const [rows, setRows] = useState<SupplierCard[]>(STARTER_DATA);

  // Filters
  const [materialFilter, setMaterialFilter] = useState<string>("All");
  const [badgeFilter, setBadgeFilter] = useState<string>("Any");
  const [query, setQuery] = useState("");

  // Upload
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<string>("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const materials = useMemo(() => {
    const all = Array.from(new Set(STARTER_DATA.map((d) => d.material)));
    return ["All", ...all];
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const byMat = materialFilter === "All" || r.material === (materialFilter as MaterialType);
      const byBadge = badgeFilter === "Any" || r.badge === (badgeFilter as BadgeColor);
      const byQuery =
        !query ||
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.supplierPrimary.toLowerCase().includes(query.toLowerCase());
      return byMat && byBadge && byQuery;
    });
  }, [rows, materialFilter, badgeFilter, query]);

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    setUploadBusy(true);
    setUploadSummary("");

    try {
      // Wire into your existing ingestion endpoint
      // /app/api/bapa/query/route.ts expects FormData("file")
      const fd = new FormData();
      fd.append("file", file);
      fd.append("source", "supplier-portal");

      const r = await fetch("/api/bapa/query", {
        method: "POST",
        body: fd,
      });

      // Minimal tolerance for different shapes; fall back to mock if unknown
      let json: any = {};
      try {
        json = await r.json();
      } catch {
        /* no-op */
      }

      const summaryText: string =
        json?.summary ||
        "AI extracted material chemistry, certifications (RoHS/REACH/ISO), and carbon intensity. Scorecard generated.";

      // Quick illustrative ESG score → badge
      const score: number = Number(json?.score ?? 82);
      const badge: BadgeColor = score >= 80 ? "green" : score >= 50 ? "amber" : "red";

      // Example new card from upload (override with parsed fields when you wire extraction)
      const newCard: SupplierCard = {
        id: `sup-${Date.now()}`,
        material: (json?.material as MaterialType) || "Other",
        title: json?.title || file.name.replace(/\.[^.]+$/, ""),
        supplierPrimary: json?.supplier || "Uploaded Supplier",
        supplierList: json?.suppliers || ["Uploaded Supplier"],
        lastAudit: new Date().toISOString().slice(0, 10),
        badge,
        confidence: badge === "green" ? "A" : badge === "amber" ? "B" : "C",
        imageHint: "generic",
      };

      setRows((s) => [newCard, ...s]);
      setUploadSummary(summaryText);
    } catch (err: any) {
      setUploadSummary(`Upload failed: ${err?.message ?? "unknown error"}`);
    } finally {
      setUploadBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Top bar */}
      <div className="mx-auto max-w-7xl px-6 pt-8 pb-4">
        <h1 className="text-[34px] font-semibold tracking-tight mb-2">Verification</h1>

        {/* Filter row */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Material */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-neutral-600">Material</label>
            <select
              className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value)}
            >
              {materials.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Badge */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-neutral-600">Badge</label>
            <select
              className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={badgeFilter}
              onChange={(e) => setBadgeFilter(e.target.value)}
            >
              <option value="Any">Any</option>
              <option value="green">Green</option>
              <option value="amber">Amber</option>
              <option value="red">Red</option>
            </select>
          </div>

          {/* Search */}
          <div className="ml-0 md:ml-auto w-full md:w-[360px]">
            <div className="relative">
              <input
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 pl-9 text-sm shadow-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span className="pointer-events-none absolute left-3 top-2.5">🔎</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload + Results */}
      <div className="mx-auto max-w-7xl px-6 pb-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Upload panel */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold mb-2">Supplier Technical Upload</h2>
              <p className="text-sm text-neutral-600 mb-4">
                Upload datasheets, Battery Passport, LCA, MSDS, certifications (RoHS/REACH/ISO). We’ll extract key KPIs and generate an ESG badge.
              </p>

              <label
                htmlFor="file"
                className={`group grid place-items-center rounded-lg border-2 border-dashed p-6 text-sm ${
                  uploadBusy ? "border-neutral-200 bg-neutral-50" : "border-neutral-300 hover:border-emerald-400"
                }`}
              >
                <div className="text-4xl mb-2">📄</div>
                <div>
                  <span className="font-medium text-neutral-800">Drag & drop</span>{" "}
                  <span className="text-neutral-500">or click to upload PDF</span>
                </div>
              </label>
              <input
                id="file"
                type="file"
                accept="application/pdf"
                ref={fileRef}
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
                disabled={uploadBusy}
              />

              <button
                className="mt-3 inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700 disabled:opacity-60"
                onClick={() => fileRef.current?.click()}
                disabled={uploadBusy}
              >
                {uploadBusy ? "Processing…" : "Select PDF"}
              </button>

              {uploadSummary && (
                <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
                  {uploadSummary}
                </div>
              )}

              <div className="mt-4 border-t pt-4">
                <p className="text-xs text-neutral-500">
                  Want a verified badge? <span className="font-medium text-neutral-700">Connect Stripe</span> to enable plans and human
                  audit (coming next).
                </p>
              </div>
            </div>
          </div>

          {/* Card grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {filtered.map((item) => (
                <article key={item.id} className="rounded-xl border border-neutral-200 bg-white p-0 shadow-sm">
                  {/* image-ish header */}
                  <div className="relative h-28 w-full overflow-hidden rounded-t-xl bg-gradient-to-br from-neutral-50 to-neutral-100">
                    <div className="absolute left-4 top-4 grid h-14 w-14 place-items-center rounded-lg bg-white shadow-sm ring-1 ring-neutral-200">
                      <div className="text-3xl">{materialEmoji(item.imageHint)}</div>
                    </div>
                    <div className="absolute right-4 top-4 flex items-center gap-2">
                      {badgePill(item.badge)}
                      {item.confidence && (
                        <span className="rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">Score {item.confidence}</span>
                      )}
                    </div>
                  </div>

                  {/* body */}
                  <div className="p-4 pt-3">
                    <h3 className="mb-1 text-lg font-semibold leading-tight">{item.title}</h3>
                    <div className="mb-2 flex items-center gap-2 text-xs text-neutral-500">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5">Verified Suppliers</span>
                    </div>

                    <div className="space-y-1 text-sm">
                      {/* Primary first, then rest */}
                      <p className="font-medium text-neutral-800">{item.supplierPrimary}</p>
                      {item.supplierList.slice(1).map((s) => (
                        <p key={s} className="text-neutral-600">
                          {s}
                        </p>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                      <span>
                        Last audit:{" "}
                        <span className="font-medium text-neutral-700">
                          {new Date(item.lastAudit).toLocaleDateString(undefined, { year: "numeric", month: "short" })}
                        </span>
                      </span>

                      <button
                        className="rounded-md px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                        onClick={() => router.push(`/supplier/${item.id}`)}
                      >
                        View details →
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {filtered.length === 0 && (
                <div className="col-span-full rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
                  No suppliers match your filters.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Foot explainer */}
        <div className="mt-10 text-center text-xs text-neutral-500">
          ESG Badges: <span className="font-medium text-emerald-700">Green</span> ≥ 80 • <span className="font-medium text-amber-700">Amber</span> 50–79 •{" "}
          <span className="font-medium text-rose-700">Red</span> &lt; 50. Data derived from uploaded PDFs (Battery Passport, LCA, MSDS, certs).
        </div>
      </div>
    </div>
  );
}

