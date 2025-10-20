// app/upload/page.tsx

"use client";

import { useState } from "react";
import { UploadCloud, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SupplierUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("supplier", "Supplier Demo");
      formData.append("sku", "SKU-DEMO-001");

      const res = await fetch("/api/risk/classify", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error("Upload failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/40 px-6 py-16">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl font-light text-slate-900 mb-3">
          Supplier Technical Upload
        </h1>
        <p className="text-slate-600 mb-10">
          Upload battery passports, MSDS, or ESG certifications. 
          Our AI will extract key compliance data and generate your Veracity badge.
        </p>

        {!result ? (
          <Card className="max-w-2xl mx-auto border-2 border-dashed border-slate-300 bg-white shadow-sm">
            <CardContent className="p-10 flex flex-col items-center space-y-6">
              <UploadCloud className="h-12 w-12 text-slate-400" />
              <input
                type="file"
                accept="application/pdf"
                id="file-upload"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Click to upload or drag a PDF
              </label>
              <p className="text-sm text-slate-500">
                Battery passports, MSDS, REACH/ISO/ESG files accepted
              </p>

              {file && (
                <Button
                  onClick={handleUpload}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? "Analyzing..." : "Verify Document"}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-2xl mx-auto bg-white shadow-lg border border-slate-200 p-8 mt-8">
            {result.success ? (
              <>
                <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto mb-4" />
                <h2 className="text-xl font-medium text-emerald-700 mb-2">
                  Document Verified
                </h2>
                <p className="text-slate-700">
                  Status: <span className="font-semibold">{result.classification}</span>
                </p>
                <p className="text-slate-500 mt-2">
                  Risk Score: {(result.risk_score * 100).toFixed(0)}%
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => window.location.reload()}
                >
                  Upload Another
                </Button>
              </>
            ) : (
              <>
                <AlertTriangle className="h-10 w-10 text-red-600 mx-auto mb-4" />
                <h2 className="text-xl font-medium text-red-700 mb-2">
                  Upload Failed
                </h2>
                <p className="text-slate-500">{result.error}</p>
              </>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

