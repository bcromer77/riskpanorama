"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type InsightItem = {
  type: "Compliant" | "Needs Review" | "Gap" | string;
  text: string;
  sim?: number;
};

type PassportArticle = {
  article: string;
  status: "Compliant" | "Needs Review" | "Gap" | string;
  note: string;
};

type PassportResult = {
  articles?: PassportArticle[];
};

type FPICItem = {
  category: string;
  text: string;
  sim?: number;
};

type FPICResult = {
  items?: FPICItem[];
};

type IngestResponse = {
  message: string;
  id: string;
  preview: string;
  insights?: InsightItem[];
  passport?: PassportResult;
  fpic?: FPICResult;
};

function statusColour(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "compliant")
    return "bg-emerald-50 text-emerald-800 border border-emerald-200";
  if (normalized === "needs review")
    return "bg-amber-50 text-amber-800 border border-amber-200";
  if (normalized === "gap")
    return "bg-rose-50 text-rose-800 border border-rose-200";
  return "bg-slate-50 text-slate-700 border border-slate-200";
}

function insightBadge(type: string) {
  const normalized = type.toLowerCase();
  if (normalized === "compliant")
    return <Badge className="bg-emerald-100 text-emerald-800">Compliant</Badge>;
  if (normalized === "needs review")
    return <Badge className="bg-amber-100 text-amber-800">Needs review</Badge>;
  if (normalized === "gap")
    return <Badge className="bg-rose-100 text-rose-800">Gap</Badge>;
  return <Badge variant="outline">{type}</Badge>;
}

export default function InstrumentPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [supplierName, setSupplierName] = useState("");
  const [sku, setSku] = useState("");
  const [notes, setNotes] = useState("");

  const [result, setResult] = useState<IngestResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please choose a PDF to upload.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Upload failed with ${res.status}`);
      }

      const data: IngestResponse = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
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
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-xs font-semibold">
              REM
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-50">Instrument</h1>
              <p className="text-xs text-slate-400">
                Battery Passport Compliance Workbench — 
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-slate-700 bg-slate-900 text-xs"
              onClick={() => router.push("/")}
            >
              ← Back to Landing
            </Button>

            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                Connected to
              </span>
              <span className="text-xs text-emerald-300">
                MongoDB · OpenAI · Supabase
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)]">

          {/* LEFT COLUMN */}
          <section className="flex flex-col gap-4">

            {/* Upload Card */}
            <Card className="border-slate-800 bg-slate-900/60 shadow-lg shadow-emerald-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-50 flex justify-between">
                  Upload a document
                  <span className="text-[11px] text-slate-400">
                    Accepted: PDF · up to ~30k characters
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                <label
                  htmlFor="file"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/60 px-4 py-8 text-center hover:border-emerald-400/80 hover:bg-slate-900 transition"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-semibold flex items-center justify-center">
                      PDF
                    </div>
                    <div className="text-sm font-medium text-slate-100">
                      Drop a supplier / technical PDF
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 max-w-xs">
                    LCA, technical spec, supplier ESG report, FPIC policy…
                    We’ll classify it against the Battery Regulation & FPIC cues.
                  </p>

                  <Input
                    id="file"
                    type="file"
                    accept="application/pdf"
                    className="mt-4 max-w-xs border-slate-700 bg-slate-950/70 text-xs file:bg-emerald-500/20 file:text-emerald-100"
                    onChange={handleFileChange}
                  />

                  {file && (
                    <p className="mt-2 text-[11px] text-emerald-300">
                      Selected: <span className="font-medium">{file.name}</span>
                    </p>
                  )}
                </label>

                <div className="flex items-center gap-3 pt-1">
                  <Button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className="flex-1 bg-emerald-500 text-emerald-950 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-300"
                  >
                    {isUploading ? "Analysing…" : "Analyse & map to passport"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-700 text-xs text-slate-200"
                    onClick={handleReset}
                  >
                    Reset
                  </Button>
                </div>

                {error && (
                  <p className="text-xs text-rose-300 border border-rose-500/50 bg-rose-500/10 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                {result && (
                  <div className="mt-3 border border-slate-800 bg-slate-900/80 rounded-lg px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 mb-1">
                      System message
                    </p>
                    <p className="text-xs text-emerald-300">
                      {result.message}
                      <span className="float-right text-[10px] text-slate-500">
                        ID: {String(result.id).slice(-6)}
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Supplier Context */}
            <Card className="border-slate-800 bg-slate-900/60">
              <CardHeader>
                <CardTitle className="text-sm text-slate-50">
                  Supplier context (optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 uppercase">
                      Supplier / asset
                    </label>
                    <Input
                      placeholder="e.g. Northvolt — Graphite Anode"
                      className="border-slate-700 bg-slate-950/70 text-xs"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 uppercase">
                      SKU / internal ID
                    </label>
                    <Input
                      placeholder="e.g. GV-ANODE-0041"
                      className="border-slate-700 bg-slate-950/70 text-xs"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 uppercase">
                    Operator notes
                  </label>
                  <Textarea
                    rows={3}
                    placeholder="What are you checking? Carbon footprint, recycled content, FPIC coverage…"
                    className="border-slate-700 bg-slate-950/70 text-xs"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="bg-slate-800 text-[10px] text-slate-200">
                      CSRD-ready
                    </Badge>
                    <Badge className="bg-slate-800 text-[10px] text-slate-200">
                      Battery Regulation 7 / 8 / 10 / 13
                    </Badge>
                    <Badge className="bg-slate-800 text-[10px] text-slate-200">
                      FPIC & Indigenous rights
                    </Badge>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-emerald-500/60 text-emerald-300 text-[11px]"
                  >
                    Save supplier snapshot
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* RIGHT COLUMN */}
          <section className="flex flex-col gap-4">

            {/* Snapshot */}
            <Card className="border-slate-800 bg-slate-900/70">
              <CardHeader className="pb-3 flex justify-between">
                <div>
                  <CardTitle className="text-sm text-slate-50">
                    Document snapshot
                  </CardTitle>
                  <p className="text-xs text-slate-400">
                    We show only what matters for compliance & risk.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 border border-slate-700 rounded-xl bg-slate-950/80 flex flex-col justify-center items-center">
                    <div className="h-7 w-7 bg-slate-100 rounded text-[9px] text-slate-900 flex items-center justify-center font-bold">
                      QR
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1">
                      Passport
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 uppercase">
                      Battery passport
                    </span>
                    <span className="text-xs text-emerald-300">
                      Machine-readable
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {result ? (
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {result.preview}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Upload a PDF to see what the system interprets.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Passport Classification */}
            <Card className="border-slate-800 bg-slate-900/80">
              <CardHeader>
                <CardTitle className="text-sm text-slate-50">
                  Battery Regulation readiness
                </CardTitle>
                <p className="text-xs text-slate-400">
                  Quick read-across Articles 7, 8, 10 and 13.
                </p>
              </CardHeader>

              <CardContent className="space-y-3">
                {passportArticles.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Once uploaded, the system will classify against key articles.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {passportArticles.map((a) => (
                      <div
                        key={a.article}
                        className={`rounded-xl px-3 py-3 text-xs ${statusColour(
                          a.status
                        )}`}
                      >
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-semibold">
                            {a.article.replace("Article", "Art.")}
                          </span>
                          <span className="text-[10px] uppercase tracking-wide">
                            {a.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700">
                          {a.note}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* FPIC */}
            <Card className="border-slate-800 bg-slate-900/80">
              <CardHeader>
                <CardTitle className="text-sm text-slate-50">
                  FPIC & Indigenous rights signals
                </CardTitle>
                <p className="text-xs text-slate-400">
                  Anything that appears to relate to Free, Prior and Informed Consent.
                </p>
              </CardHeader>

              <CardContent className="space-y-2">
                {fpicItems.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Upload something containing social/ESG context to detect FPIC signals.
                  </p>
                ) : (
                  fpicItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-xs"
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <Badge className="bg-violet-100 text-violet-900 text-[10px]">
                          {item.category}
                        </Badge>
                        {item.sim !== undefined && (
                          <span className="text-[10px] text-slate-400">
                            confidence {(item.sim * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-200">{item.text}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Insights */}
            <Card className="border-slate-800 bg-slate-900/80 mb-4">
              <CardHeader>
                <CardTitle className="text-sm text-slate-50">
                  Compliance insights (operator view)
                </CardTitle>
                <p className="text-xs text-slate-400">
                  Three buckets only: Compliant, Needs Review, Gap.
                </p>
              </CardHeader>

              <CardContent className="space-y-3">
                {insights.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Once uploaded, we’ll reduce the entire PDF to actionable points.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {insights.map((ins, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-xs"
                      >
                        <div className="flex justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {insightBadge(ins.type)}
                            {ins.sim !== undefined && (
                              <span className="text-[10px] text-slate-500">
                                relevance {(ins.sim * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-200">{ins.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer buttons */}
                <div className="flex justify-between items-center border-t border-slate-800 pt-3 mt-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-slate-700 text-[11px] text-slate-100"
                    >
                      Export as PDF
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400 text-[11px]"
                    >
                      Share with retailer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}

