"use client";

import React, { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle } from "lucide-react";

export default function Intelligence() {
  const params = useSearchParams();
  const mode = params.get("mode") || "analyst";
  const isSupplier = mode === "supplier";

  const [busy, setBusy] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [summary, setSummary] = useState("");
  const [result, setResult] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // 🧩 Handle PDF upload
  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    if (!file.type.includes("pdf")) {
      setUploadMsg("Please upload a PDF file.");
      return;
    }

    setBusy(true);
    setUploadMsg("Processing PDF…");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("supplier", "Demo Supplier");
      formData.append("sku", "SKU-DEMO-001");

      const res = await fetch("/api/risk/classify", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setResult(data);
      setSummary(data.summary || "");
      setUploadMsg("✅ Parsed successfully!");
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadMsg(`❌ Failed to process PDF — ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">
        {isSupplier
          ? "Supplier Technical Upload — Veracity 101"
          : "RiskPanorama — Battery & Provenance Assistant"}
      </h1>

      <p className="text-muted-foreground mb-6">
        {isSupplier
          ? "Upload compliance documents (Battery Passport, MSDS, ESG certification) to verify your SKU compliance."
          : "Upload any supplier or compliance report to extract key risk signals and regulatory exposure."}
      </p>

      {/* Upload Zone */}
      <Card className="border-dashed border-2 p-8 text-center">
        <CardContent>
          <label
            htmlFor="pdf-upload"
            className="block cursor-pointer text-muted-foreground hover:text-foreground"
          >
            Drop your supplier or compliance PDF
          </label>
          <Input
            id="pdf-upload"
            ref={fileRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => handleUpload(e.target.files)}
            disabled={busy}
            className="hidden"
          />
          <div className="flex justify-center mt-4">
            <Button
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              variant="outline"
            >
              {busy ? "Uploading…" : "Upload your document"}
            </Button>
          </div>
          {uploadMsg && (
            <p className="text-sm mt-4 text-muted-foreground">{uploadMsg}</p>
          )}
        </CardContent>
      </Card>

      {/* Result Summary */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-8"
        >
          <h2 className="font-semibold mb-2">
            {isSupplier ? "Verification Result" : "🧾 Summary"}
          </h2>

          {/* Supplier compliance block */}
          {isSupplier && (
            <Card className="p-6 mb-6 border border-slate-200 bg-slate-50">
              <CardContent className="p-0">
                <div className="flex flex-col items-center text-center space-y-2">
                  {result.risk_score < 0.3 ? (
                    <CheckCircle className="h-10 w-10 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-10 w-10 text-red-500" />
                  )}
                  <h3 className="text-lg font-medium">
                    {result.classification === "compliant"
                      ? "Compliant Document"
                      : "Potential Risk Detected"}
                  </h3>
                  <p className="text-slate-600">
                    Risk Score:{" "}
                    <span className="font-semibold">
                      {(result.risk_score * 100).toFixed(0)}%
                    </span>
                  </p>
                  <ul className="mt-3 text-sm text-slate-700 text-left">
                    {result.recommendations?.map((rec: string, i: number) => (
                      <li key={i}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analyst summary (legacy “talk to PDF” mode) */}
          {!isSupplier && summary && (
            <p className="text-muted-foreground leading-relaxed">{summary}</p>
          )}
        </motion.div>
      )}

      {/* Risk Cards (analyst mode only) */}
      {!isSupplier && cards.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="grid gap-4 mt-6"
        >
          {cards.map((c, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{c.title}</h3>
                  <Badge
                    variant={
                      c.badge === "red"
                        ? "destructive"
                        : c.badge === "amber"
                        ? "secondary"
                        : "default"
                    }
                  >
                    {c.badge.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{c.body}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}
    </main>
  );
}

