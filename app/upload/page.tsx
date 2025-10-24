"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Upload } from "lucide-react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // ---- 📤 Handle file upload ----
  async function handleUpload() {
    if (!file) return;
    setBusy(true);
    setUploadMsg("Uploading and classifying...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("supplier", "Demo Supplier Ltd");
      formData.append("sku", "SKU-DEMO-001");

      const res = await fetch("/api/risk/classify", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");

      setResult(data);
      setUploadMsg("✅ Parsed successfully!");
    } catch (err: any) {
      setUploadMsg(`❌ Failed to process PDF — ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  // ---- 🧠 UI ----
  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-2">
        Supplier Upload — Battery & Provenance Check
      </h1>
      <p className="text-muted-foreground mb-6">
        Upload any supplier or compliance report to extract key risk signals,
        passport gaps, and regulatory exposure.
      </p>

      {!result ? (
        <Card className="border-dashed border-2 p-8 text-center bg-white shadow-sm">
          <CardContent>
            <p className="mb-4 text-slate-600">
              Drop your supplier or compliance PDF
            </p>
            <Input
              type="file"
              ref={fileRef}
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-upload"
            />

            <div className="flex flex-col gap-3 justify-center items-center">
              <Button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose PDF
              </Button>

              <Button
                onClick={handleUpload}
                disabled={!file || busy}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {busy ? "Processing…" : "Upload document"}
              </Button>
            </div>

            {uploadMsg && (
              <p className="text-sm mt-4 text-slate-500">{uploadMsg}</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-8 shadow-md border bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              {result.classification === "missing_passport" ? (
                <AlertTriangle className="h-6 w-6 text-red-600" />
              ) : (
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              )}
              <h2 className="text-lg font-semibold">
                {result.classification === "missing_passport"
                  ? "At Risk"
                  : "Compliant"}
              </h2>
              <Badge
                className={`ml-auto ${
                  result.risk_score > 0.7
                    ? "bg-red-100 text-red-700"
                    : result.risk_score > 0.4
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                Risk {(result.risk_score * 100).toFixed(0)}%
              </Badge>
            </div>

            <p className="text-sm text-slate-700 mb-2">
              {result.metadata?.risk_factors?.join(" • ")}
            </p>

            <ul className="list-disc pl-5 text-sm text-slate-600">
              {result.recommendations?.map((r: string, i: number) => (
                <li key={i}>{r}</li>
              ))}
            </ul>

            <p className="text-xs text-slate-400 mt-4">
              {new Date().toLocaleString()}
            </p>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setResult(null);
                  setFile(null);
                  setUploadMsg("");
                }}
                variant="outline"
              >
                Upload another
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

