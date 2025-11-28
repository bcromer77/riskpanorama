"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, AlertTriangle, CheckCircle2, X, Search, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getServerSession } from "next-auth/next";

// -----------------------------------
// Types matching the /api/ingest response structure
// -----------------------------------
type InsightItem = { type: string; text: string; sim?: number };
type PassportArticle = { article: string; status: string; note: string };
type FPICItem = { category: string; text: string; sim?: number };

type IngestResponse = {
  message: string;
  id: string;
  preview: string;
  insights?: InsightItem[];
  passport?: { articles?: PassportArticle[] };
  fpic?: { items?: FPICItem[] };
};

// -----------------------------------
// Component Helpers
// -----------------------------------
const statusColour = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes("compliant")) return "bg-emerald-900/40 text-emerald-300 border border-emerald-800";
  if (s.includes("review") || s.includes("validation")) return "bg-amber-900/40 text-amber-300 border border-amber-800";
  if (s.includes("gap") || s.includes("missing")) return "bg-rose-900/40 text-rose-300 border border-rose-800";
  return "bg-slate-800 text-slate-400 border border-slate-700";
};

const insightBadge = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes("compliant")) return <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] border-emerald-700">Compliant</Badge>;
  if (t.includes("review")) return <Badge className="bg-amber-500/20 text-amber-300 text-[10px] border-amber-700">Needs Review</Badge>;
  if (t.includes("gap")) return <Badge className="bg-rose-500/20 text-rose-300 text-[10px] border-rose-700">Gap</Badge>;
  return <Badge variant="outline" className="text-[10px]">{type}</Badge>;
};

// -----------------------------------
// Main Component
// -----------------------------------
export default function InstrumentPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IngestResponse | null>(null);

  // Optional context (currently not sent to API, but ready for future integration)
  const [supplierName, setSupplierName] = useState("");
  const [sku, setSku] = useState("");
  const [notes, setNotes] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return setError("Please select a PDF first.");

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      // FUTURE STEP: Add supplierName, SKU, and notes to formData here

      const res = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        
        // CRITICAL: Handle 402 Insufficient Credits directly
        if (res.status === 402) {
             throw new Error(data.error || "Insufficient credits to seal document (Requires 1 credit).");
        }
        
        throw new Error(data.error || `Server error ${res.status}`);
      }

      const data: IngestResponse = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Upload failed. Try again.");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setSupplierName("");
    setSku("");
    setNotes("");
  };

  const passportArticles = result?.passport?.articles ?? [];
  const fpicItems = result?.fpic?.items ?? [];
  const insights = result?.insights ?? [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-xs font-semibold">
              REM
            </div>
            <div>
              <h1 className="text-sm font-semibold">Instrument</h1>
              <p className="text-xs text-slate-400">Battery Passport & FPIC Compliance Workbench</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="border-slate-700 text-xs" onClick={() => router.push("/vault")}>
              ← Go to Vault
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1.6fr]">

          {/* LEFT COLUMN */}
          <section className="space-y-5">

            {/* Upload Card */}
            <Card className="border-slate-800 bg-slate-900/60 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-sm flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Upload & Analyse (1 Credit)
                  </span>
                  <span className="text-[11px] text-slate-400">PDF only • max 100 MB</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label htmlFor="file-upload" className="block cursor-pointer rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center hover:border-emerald-500/60 transition">
                  <div className="mx-auto max-w-xs space-y-3">
                    <div className="h-12 w-12 mx-auto rounded-full bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-emerald-400" />
                    </div>
                    <p className="text-sm font-medium">Drop your supplier PDF here</p>
                    <p className="text-xs text-slate-400">LCA, audit report, ESG policy, technical spec…</p>
                  </div>
                  <Input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    id="file-upload"
                    onChange={handleFileChange}
                  />
                </label>

                {file && (
                  <div className="flex items-center justify-between bg-slate-900/80 rounded-lg px-4 py-2">
                    <span className="text-xs text-emerald-300 truncate max-w-[200px]">{file.name}</span>
                    <button onClick={() => setFile(null)} className="text-xs text-slate-500 hover:text-slate-300">Remove</button>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className="flex-1 bg-emerald-500 text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {isUploading ? "Analysing…" : "Analyse & Seal"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleReset} className="border-slate-700 text-xs">
                    Reset
                  </Button>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/50 text-rose-300 text-xs">
                    {error}
                  </div>
                )}

                {result && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/50 text-emerald-300 text-xs">
                    {result.message} • Sealed as <span className="font-mono">{result.id.slice(-8)}</span>
                    <Button 
                        onClick={() => router.push(`/vault/${result.id}`)}
                        variant="ghost"
                        size="sm"
                        className="float-right text-[10px] text-slate-400 hover:text-emerald-300 p-0 h-auto"
                    >
                        View Vault Record →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Optional Context */}
            <Card className="border-slate-800 bg-slate-900/60">
              <CardHeader>
                <CardTitle className="text-sm">Supplier Context (optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Supplier name" value={supplierName} onChange={e => setSupplierName(e.target.value)} className="text-xs border-slate-700 bg-slate-950/70" />
                  <Input placeholder="SKU / Part ID" value={sku} onChange={e => setSku(e.target.value)} className="text-xs border-slate-700 bg-slate-950/70" />
                </div>
                <Textarea
                  placeholder="Notes: What are you checking? Carbon? FPIC? Recycled content?"
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="text-xs border-slate-700 bg-slate-950/70"
                />
              </CardContent>
            </Card>
          </section>

          {/* RIGHT COLUMN — Results */}
          <section className="space-y-5">

            {/* Passport Articles (6-Article Classification) */}
            <Card className="border-slate-800 bg-slate-900/80">
              <CardHeader>
                <CardTitle className="text-sm">Battery Regulation Articles (Art. 7, 8, 10, 12, 13, 39)</CardTitle>
                <p className="text-xs text-slate-400">Classification against the six mandatory data groups required by the EU Battery Regulation.</p>
              </CardHeader>
              <CardContent>
                {passportArticles.length === 0 ? (
                  <p className="text-xs text-slate-500">No classification yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {passportArticles.map((a, i) => (
                      <div key={i} className={`p-4 rounded-xl ${statusColour(a.status)}`}>
                        <div className="font-semibold text-xs mb-1">{a.article.replace("Article", "Art.")}</div>
                        <div className="text-[11px] opacity-90">{a.note}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* FPIC Signals */}
            <Card className="border-slate-800 bg-slate-900/80">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-violet-400" /> FPIC & Indigenous Rights Signals
                </CardTitle>
                <p className="text-xs text-slate-400">Extraction of contextual language relating to Free, Prior and Informed Consent.</p>
              </CardHeader>
              <CardContent>
                {fpicItems.length === 0 ? (
                  <p className="text-xs text-slate-500">No FPIC signals detected.</p>
                ) : (
                  <div className="space-y-3">
                    {fpicItems.map((item, i) => (
                      <div key={i} className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
                        <Badge className="mb-2 text-[10px] bg-violet-500/30 text-violet-200">{item.category}</Badge>
                        <p className="text-xs text-slate-200">{item.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Insights */}
            <Card className="border-slate-800 bg-slate-900/80 mb-4">
              <CardHeader>
                <CardTitle className="text-sm">Compliance Insights (AI-Analyzed Snippets)</CardTitle>
                <p className="text-xs text-slate-400">Directly extracted and categorized snippets from the PDF.</p>
              </CardHeader>
              <CardContent>
                {insights.length === 0 ? (
                  <p className="text-xs text-slate-500">Upload to see detailed insights.</p>
                ) : (
                  <div className="space-y-3">
                    {insights.map((ins, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-900/80 border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          {insightBadge(ins.type)}
                          {ins.sim !== undefined && (
                            <span className="text-[10px] text-slate-500">relevance {(ins.sim * 100).toFixed(0)}%</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-200">{ins.text}</p>
                      </div>
                    ))}
                    <div className="flex justify-end pt-2">
                        <Button 
                            onClick={() => router.push("/search")}
                            variant="outline"
                            size="sm"
                            className="border-slate-700 text-xs text-slate-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                            <Search className="w-3 h-3" /> Run Agentic Risk Scan
                        </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </section>
        </div>
      </main>
    </div>
  );
}
