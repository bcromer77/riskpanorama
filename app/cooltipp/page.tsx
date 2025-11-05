"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Zap,
  Shield,
  Users,
  Link2,
} from "lucide-react";

// ---------- Types ----------
type CountySnapshot = {
  county: string;
  resilienceScore: number;
  nis2Exposure: "LOW" | "MEDIUM" | "HIGH";
  gridStress: string;
  keyRisks: string[];
  topOpportunities: string[];
};

type ResearchDoc = {
  id: string;
  title: string;
  author: string;
  uploadedAt: string;
  status: "analysed" | "processing" | "error";
  summary: string;
  impactAreas: string[];
};

type FundingItem = {
  program: string;
  sponsor: string;
  amountHint: string;
  appliesTo: string[];
  status: "open" | "planned" | "closing";
};

type Persona = {
  name: string;
  role: string;
  goal: string;
  nextStep: string;
};

// ---------- Small helpers ----------
function StatusBadge({ status }: { status: ResearchDoc["status"] }) {
  const map = {
    analysed: { bg: "bg-green-100", fg: "text-green-800", label: "Ready" },
    processing: { bg: "bg-yellow-100", fg: "text-yellow-800", label: "Processing" },
    error: { bg: "bg-red-100", fg: "text-red-800", label: "Error" },
  } as const;
  const { bg, fg, label } = map[status];
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${bg} ${fg}`}>
      {label}
    </span>
  );
}

function FundingStatus({ status }: { status: FundingItem["status"] }) {
  const map = {
    open: { bg: "bg-green-100", fg: "text-green-800", label: "Open" },
    planned: { bg: "bg-blue-100", fg: "text-blue-800", label: "Planned" },
    closing: { bg: "bg-red-100", fg: "text-red-800", label: "Closing soon" },
  } as const;
  const { bg, fg, label } = map[status];
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${bg} ${fg}`}>
      {label}
    </span>
  );
}

// ---------- Main ----------
export default function CoolTippDashboardPage() {
  const [snapshot, setSnapshot] = useState<CountySnapshot | null>(null);
  const [docs, setDocs] = useState<ResearchDoc[]>([]);
  const [funding, setFunding] = useState<FundingItem[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ---------- On mount ----------
  useEffect(() => {
    setSnapshot({
      county: "Tipperary",
      resilienceScore: 72,
      nis2Exposure: "MEDIUM",
      gridStress:
        "Rural substations are near thermal limit during peak milking + EV charging hours.",
      keyRisks: [
        "Single point-of-failure wastewater pump in Cahir",
        "Telemetry vendor not NIS2-audited",
        "Hospital backup gensets not grid-synced",
      ],
      topOpportunities: [
        "Farm-hosted 1–2 MWh batteries as paid grid buffer (Galina’s model)",
        "Waste-heat capture from data centres into district heating",
        "Microgrid for water pumps to meet NIS2 continuity",
      ],
    });

    setFunding([
      {
        program: "Rural Microgrid / Just Transition",
        sponsor: "SEAI / Dept. Climate",
        amountHint: "€250k – €1.2m / pilot",
        appliesTo: [
          "Farm battery buffer",
          "Water pump backup microgrid",
          "EV charging resilience",
        ],
        status: "open",
      },
      {
        program: "Data Centre Heat Reuse Incentive",
        sponsor: "Enterprise Ireland",
        amountHint: "CapEx match 40–60%",
        appliesTo: ["District heating loops", "Greenhouse clusters"],
        status: "planned",
      },
      {
        program: "Critical Infrastructure Continuity (NIS2)",
        sponsor: "EU Resilience Facility",
        amountHint: "€500 k +",
        appliesTo: ["Wastewater continuity", "Hospital ICU backup"],
        status: "closing",
      },
    ]);

    setPersonas([
      {
        name: "Galina Kennedy",
        role: "Grid Resilience Researcher",
        goal:
          "Prove that farm-scale batteries stabilise the rural grid and create new revenue for farmers.",
        nextStep:
          "Map which substations can spill to farms within 500 m of existing 3-phase lines.",
      },
      {
        name: "Tipperary County Council",
        role: "Emergency / Climate Office",
        goal:
          "Stay compliant with NIS2 for pumps, hospitals, and EV charging without waiting for national utility.",
        nextStep: "Bundle a 9-month pilot with continuity plan + funding app.",
      },
      {
        name: "Grid / ESB Ops",
        role: "Network Reliability",
        goal: "Identify single-point-failures before winter storms.",
        nextStep: "Review microgrid proposals that offload peak stress.",
      },
    ]);

    // --- Load uploaded docs dynamically from Mongo ---
    async function fetchDocs() {
      const res = await fetch("/api/query");
      const data = await res.json();
      if (data.success) {
        setDocs(
          data.docs.map((d: any, i: number) => ({
            id: d._id ?? `doc-${i}`,
            title: d.fileName ?? "Uploaded Document",
            author: d.parser === "chatpdf" ? "ChatPDF Summary" : "Native Parser",
            uploadedAt: d.createdAt,
            status: "analysed",
            summary: (d.text || "").slice(0, 300) + "...",
            impactAreas: ["AI Summary", "Embedding Ready"],
          }))
        );
      }
    }
    fetchDocs();
  }, []);

  // ---------- Upload ----------
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/ingest", { method: "POST", body: formData });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      await new Promise((r) => setTimeout(r, 1000));
      window.location.reload(); // refresh instantly to show new doc
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  // ---------- UI ----------
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50 text-slate-900 p-6 md:p-10 space-y-8">

      {/* HEADER */}
      <motion.section
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            CoolTipp — County Energy & Resilience Intelligence
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Upload research, cross-reference it with county plans and funding,
            and see who benefits in seconds — not months.
          </p>
        </div>
        <label className="cursor-pointer group flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2 shadow-sm hover:bg-emerald-50 hover:border-emerald-300 text-sm font-medium text-slate-700 w-fit">
          <Upload className="h-4 w-4 text-slate-500 group-hover:text-emerald-700" />
          <span>{uploading ? "Uploading…" : "Upload PDF / Study"}</span>
          <input
            type="file"
            className="hidden"
            accept="application/pdf"
            disabled={uploading}
            onChange={handleUpload}
          />
        </label>
      </motion.section>

      {uploadError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md w-fit">
          {uploadError}
        </div>
      )}

      {/* GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — Snapshot + Docs */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* County Snapshot */}
          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold">Tipperary Snapshot</h2>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase text-slate-400">Resilience Score</div>
                <div className="text-2xl font-bold text-emerald-700">
                  {snapshot?.resilienceScore ?? "--"}/100
                </div>
              </div>
            </div>

            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <motion.div
                className="rounded-xl border border-slate-200 p-4 bg-gradient-to-br from-amber-50 to-white"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  {snapshot?.nis2Exposure === "HIGH" ? (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  ) : snapshot?.nis2Exposure === "MEDIUM" ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  <span>NIS2 Exposure: {snapshot?.nis2Exposure}</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">{snapshot?.gridStress}</p>
                <ul className="mt-2 text-xs space-y-1">
                  {snapshot?.keyRisks.map((r, i) => (
                    <li key={i} className="bg-slate-100 rounded px-2 py-1">{r}</li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                className="rounded-xl border border-slate-200 p-4 bg-gradient-to-br from-emerald-50 to-white"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Zap className="h-4 w-4 text-emerald-600" />
                  <span>Top Opportunities</span>
                </div>
                <ul className="mt-2 text-xs space-y-1">
                  {snapshot?.topOpportunities.map((o, i) => (
                    <li key={i} className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded px-2 py-1">
                      {o}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </motion.div>

          {/* Research Docs */}
          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-semibold">Research & Evidence</h2>
              </div>
              <div className="text-xs text-slate-500">{docs.length} documents</div>
            </div>

            <div className="space-y-4">
              {docs.map((d) => (
                <motion.div
                  key={d.id}
                  className="border border-slate-200 rounded-lg p-4 bg-gradient-to-br from-white to-slate-50 hover:shadow-md transition"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{d.title}</div>
                    <StatusBadge status={d.status} />
                  </div>
                  <div className="text-xs text-slate-500">
                    {d.author} • {new Date(d.uploadedAt).toLocaleDateString()}
                  </div>
                  <p className="text-sm text-slate-700 mt-2">{d.summary}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {d.impactAreas.map((a, i) => (
                      <span key={i} className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2 py-1">
                        {a}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
              {docs.length === 0 && (
                <div className="text-sm text-slate-500 italic">
                  Upload a PDF to see its summary instantly.
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* RIGHT — Personas + Funding + CrossRef */}
        <div className="flex flex-col gap-6">
          {/* Personas */}
          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-pink-600" />
              <h2 className="text-lg font-semibold">Stakeholders</h2>
            </div>
            {personas.map((p, i) => (
              <div key={i} className="mb-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-xs text-slate-500">{p.role}</div>
                <p className="text-xs mt-1"><span className="font-semibold">Goal:</span> {p.goal}</p>
                <p className="text-[11px] text-slate-500 mt-1"><span className="font-semibold">Next:</span> {p.nextStep}</p>
              </div>
            ))}
          </motion.div>

          {/* Cross-Reference Insight */}
          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 relative overflow-hidden"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold">Cross-Reference Insight</h2>
            </div>
            <p className="text-sm text-slate-700 mb-2">
              Compare Galina’s research with County and SEAI plans to see alignment and fundable gaps.
            </p>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• <em>Common keywords:</em> battery buffer, microgrid, district heating</li>
              <li>• <em>Shared beneficiaries:</em> rural farms within 5 km of data centres</li>
              <li>• <em>Funding trigger:</em> NIS2 + SEAI overlap → immediate pilot eligibility</li>
            </ul>
          </motion.div>

          {/* Funding */}
          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold">Funding Opportunities</h2>
            </div>
            {funding.map((f, i) => (
              <div key={i} className="border border-slate-100 rounded-lg p-3 mb-2 bg-gradient-to-br from-emerald-50/40 to-white">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium">{f.program}</div>
                  <FundingStatus status={f.status} />
                </div>
                <div className="text-xs text-slate-500">Sponsor: {f.sponsor}</div>
                <div className="text-xs mt-2 flex flex-wrap gap-2">
                  {f.appliesTo.map((a, idx) => (
                    <span key={idx} className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full px-2 py-1 text-[11px]">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </main>
  );
}

