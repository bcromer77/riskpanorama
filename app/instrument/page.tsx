// app/instrument/page.tsx — KYE — Know Your Evidence™
// Secure Evidence Vault for Battery Supply-Chain Legitimacy

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Shield, FileCheck, Download, Share2, AlertCircle, CheckCircle2 } from "lucide-react";


type PassportArticle = {
  article: string;
  status: "Evidence Verified" | "Needs Validation" | "Missing Evidence";
  note: string;
  regulation?: string;
};

type IngestResponse = {
  message: string;
  id: string;
  preview: string;
  passport?: { articles?: PassportArticle[] };
};

export default function InstrumentPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IngestResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return setError("Please choose a PDF to upload.");
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/ingest", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsUploading(false);
    }
  };

  const articles = result?.passport?.articles ?? [];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="border-b border-cyan-900/30 bg-black/90 backdrop-blur">
          <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center">
                <Shield className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">KYE — Know Your Evidence™</h1>
                <p className="text-xs text-cyan-400">Secure Evidence Vault for Battery Supply-Chain Legitimacy</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
              ← Back
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid lg:grid-cols-2 gap-8">

            {/* LEFT — Upload */}
            <Card className="border-cyan-900/50 bg-black/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-cyan-400" />
                  Upload Evidence Source
                </CardTitle>
                <p className="text-sm text-gray-400">
                  Upload declarations, contracts, audits, LCAs & FPIC documentation for evidence validation.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <label className="block cursor-pointer rounded-xl border-2 border-dashed border-cyan-800/50 bg-black/30 p-12 text-center hover:border-cyan-400 transition">
                  <div className="mx-auto max-w-sm">
                    <div className="mb-4 flex justify-center">
                      <div className="h-20 w-20 rounded-full bg-cyan-500/20 border-4 border-cyan-400 flex items-center justify-center">
                        <FileCheck className="h-12 w-12 text-cyan-400" />
                      </div>
                    </div>
                    <p className="text-sm font-medium">Drop a supplier declaration, technical spec, or ESG claim</p>
                    <Input type="file" accept=".pdf" className="mt-6" onChange={handleFileChange} />
                    {file && <p className="mt-3 text-xs text-cyan-300">Selected: {file.name}</p>}
                  </div>
                </label>

                <Button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="w-full h-14 bg-cyan-500 text-black hover:bg-cyan-400 font-bold text-lg"
                >
                  {isUploading ? "Extracting & Verifying…" : "Extract & Verify Evidence"}
                </Button>
              </CardContent>
            </Card>

            {/* RIGHT — Results */}
            <div className="space-y-6">

              {/* Extracted Evidence Summary */}
              <Card className="border-cyan-900/50 bg-black/50">
                <CardHeader>
                  <CardTitle>Extracted Evidence Summary</CardTitle>
                  <p className="text-sm text-gray-400">
                    Only machine-readable evidence relevant to admissible claims is shown.
                  </p>
                </CardHeader>
                <CardContent>
                  {result ? (
                    <p className="text-sm text-gray-300 leading-relaxed">{result.preview}</p>
                  ) : (
                    <p className="text-sm text-gray-500">Upload evidence to see verified summary.</p>
                  )}
                </CardContent>
              </Card>

              {/* NEW: Evidence Classification Card */}
              <Card className="border-cyan-900/50 bg-black/50">
                <CardHeader>
                  <CardTitle>Evidence Classification — Passport Inputs & Legitimacy Requirements</CardTitle>
                  <p className="text-sm text-gray-400">
                    Classified against EU Battery Regulation (Art. 7, 8, 10, 13, 77), CSDDD, LkSG and FPIC obligations.
                  </p>
                </CardHeader>
                <CardContent>
                  {articles.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {articles.map((a: any, idx: number) => (
                        <div key={idx} className="rounded-lg border border-cyan-800/40 px-4 py-3 text-xs bg-black/40">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-cyan-300">
                              {a.article.replace("Article", "Art.")}
                            </span>
                            <div>
                              {a.status === "Evidence Verified" && (
                                <Badge className="bg-emerald-900/30 text-emerald-300 border-emerald-700 text-[10px]">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                              {a.status === "Needs Validation" && (
                                <Badge className="bg-amber-900/30 text-amber-300 border-amber-700 text-[10px]">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Needs Validation
                                </Badge>
                              )}
                              {a.status === "Missing Evidence" && (
                                <Badge className="bg-rose-900/30 text-rose-300 border-rose-700 text-[10px]">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Missing
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-400 leading-tight">{a.note}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Upload evidence to see classification.</p>
                  )}
                </CardContent>
              </Card>

              {/* Your existing FPIC / Insights cards go here — unchanged */}

            </div>
          </div>

          {/* Critical Liability Shield */}
          <p className="text-[10px] text-gray-500 mt-12 text-center max-w-4xl mx-auto leading-relaxed">
            This tool validates evidence presence, attribution and completeness. 
            It does not constitute legal advice, certification, or factual verification of supplier claims.
          </p>
        </main>
      </div>
    </TooltipProvider>
  );
}
