"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Search, Sparkles, AlertTriangle } from "lucide-react";

export default function Instrument() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  // Step 1 — Upload & extract
  async function handleUpload() {
    if (!file) return alert("Please choose a file first.");
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/ingest", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);

    if (data.error) alert(`Upload failed: ${data.error}`);
    else {
      alert("✅ Extraction complete");
      // Mock risk values for demo visualisation
      setInsights([
        {
          text: data.preview || "Document parsed successfully.",
          score: 0.88,
        },
        {
          text: "Supply-chain due diligence clause references Article 8 requirements.",
          score: 0.72,
        },
        {
          text: "No mention of battery passport QR integration — potential compliance gap.",
          score: 0.55,
        },
      ]);
    }
  }

  // Step 3 — Query
  async function handleQuery() {
    if (!query) return;
    const res = await fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    setResults(Array.isArray(data) ? data : []);
  }

  // Risk-colour helper
  function riskColor(score: number) {
    if (score >= 0.8) return "text-emerald-700 bg-emerald-50";
    if (score >= 0.6) return "text-amber-700 bg-amber-50";
    return "text-rose-700 bg-rose-50";
  }

  function riskLabel(score: number) {
    if (score >= 0.8) return "Compliant";
    if (score >= 0.6) return "Needs Review";
    return "Gap";
  }

  return (
    <main className="min-h-screen bg-[#FAFAF6] text-slate-800 flex flex-col items-center py-16 px-4">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl font-semibold text-[#136A43] mb-4 tracking-tight">
          Regulatory Impact Intelligence
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
          A calm, three-step workspace for compliance comprehension.
        </p>
      </motion.section>

      {/* Progress Tracker */}
      <div className="flex justify-center gap-3 mb-14 text-sm text-gray-500">
        {["1 Upload & Extract", "2 See Insights", "3 Ask Questions"].map(
          (label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                  (i === 0 && file) ||
                  (i === 1 && insights.length > 0) ||
                  (i === 2 && results.length > 0)
                    ? "border-[#136A43] bg-[#136A43] text-white"
                    : "border-gray-300 text-gray-400"
                }`}
              >
                {i + 1}
              </div>
              <span>{label}</span>
              {i < 2 && <div className="w-10 h-[1px] bg-gray-300 mx-2" />}
            </div>
          )
        )}
      </div>

      {/* Step 1 */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 w-full max-w-2xl text-center mb-16"
      >
        <h2 className="font-semibold text-[#136A43] text-lg mb-6 flex justify-center items-center gap-2">
          <Upload className="w-5 h-5" /> 1 Upload and Extract
        </h2>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-sm text-gray-600 mb-6"
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="bg-[#136A43] text-white font-medium px-8 py-2 rounded-full hover:bg-[#0e4f32] disabled:bg-gray-300 transition"
        >
          {uploading ? "Processing …" : "Upload & Parse"}
        </button>
      </motion.section>

      {/* Step 2 */}
      {insights.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-5xl mb-20"
        >
          <h2 className="text-[#136A43] font-semibold mb-6 flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5" /> 2 See What’s Inside
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {insights.map((d, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${riskColor(
                      d.score
                    )}`}
                  >
                    {riskLabel(d.score)}
                  </span>
                  <span className="text-xs text-gray-500">
                    sim {d.score.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {d.text}
                </p>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Step 3 */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl mb-16"
      >
        <h2 className="text-[#136A43] font-semibold mb-5 flex items-center gap-2 text-lg">
          <Search className="w-5 h-5" /> 3 Ask Questions or Run Queries
        </h2>
        <div className="flex gap-3 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Ask e.g. What are our lithium sourcing risks?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-[#136A43]"
            />
          </div>
          <button
            onClick={handleQuery}
            className="bg-[#136A43] text-white font-medium px-6 py-2 rounded-full hover:bg-[#0e4f32] transition"
          >
            Search
          </button>
        </div>

        <div className="grid gap-5">
          {Array.isArray(results) && results.length > 0 ? (
            results.map((r, i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition"
              >
                <div className="flex justify-between mb-2">
                  <h3 className="font-semibold text-[#136A43] flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {r.metadata?.filename || "Matched Context"}
                  </h3>
                  <span className="text-xs text-gray-500">
                    sim {r.score?.toFixed?.(2) ?? "—"}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {r.text || "No content found."}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm text-center italic">
              No results yet — upload a PDF and ask a question.
            </p>
          )}
        </div>
      </motion.section>
    </main>
  );
}

