"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, CheckCircle, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function DemoPage() {
  const [stage, setStage] = useState<"upload" | "processing" | "done">("upload");
  const [fileName, setFileName] = useState("");
  const proofUrl = "https://www.rareearthminerals.ai/demo-proof";

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setStage("processing");
    setTimeout(() => setStage("done"), 3000); // fake comprehension delay
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-gray-900 to-emerald-950 text-white overflow-hidden flex flex-col items-center justify-center">
      {/* Watermark Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5 select-none flex items-center justify-center text-4xl font-semibold tracking-widest">
        RAREEARTHMINERALS.AI — Proof. Clarity. Comprehension.
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-serif mb-3">
          See Complexity Turn Into Proof
        </h1>
        <p className="text-sm md:text-base text-gray-300">
          Every document hides evidence of responsibility. We reveal it — clearly, instantly, beautifully.
        </p>
      </motion.div>

      {/* Upload / Proof Engine Section */}
      <motion.div
        className="relative bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-10 w-[90%] md:w-[650px] text-center backdrop-blur-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {stage === "upload" && (
          <div>
            <Upload size={48} className="mx-auto mb-4 text-emerald-400" />
            <h2 className="text-xl font-semibold mb-2">Upload Your Document</h2>
            <p className="text-gray-400 mb-4 text-sm">
              Drop in a sustainability report, policy, or disclosure.
            </p>
            <label className="cursor-pointer inline-block bg-emerald-600 hover:bg-emerald-500 transition px-6 py-3 rounded-full font-medium">
              Select File
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFile}
                className="hidden"
              />
            </label>
          </div>
        )}

        {stage === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <FileText size={42} className="text-emerald-400 mb-4" />
            <p className="text-lg font-semibold">Analysing: {fileName}</p>
            <p className="text-sm text-gray-400 mt-2 mb-4">
              Extracting meaning… Linking policy… Building proof…
            </p>
            <div className="w-56 h-1 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500"
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        )}

        {stage === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <CheckCircle size={48} className="mx-auto text-emerald-400" />
            <h2 className="text-xl font-semibold">Digital Proof Created</h2>
            <p className="text-gray-300 text-sm">
              This report has been independently verified for authenticity and provenance.
            </p>

            {/* Proof Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {[
                {
                  title: "Policy Alignment",
                  desc: "Matches latest environmental disclosure standards.",
                },
                {
                  title: "Impact Evidence",
                  desc: "Identifies verifiable ESG and traceability data.",
                },
                {
                  title: "Clarity Report",
                  desc: "Summarised for non-technical audiences with citations.",
                },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.3 }}
                  className="bg-white/10 border border-white/20 p-4 rounded-2xl hover:bg-emerald-900/20 transition"
                >
                  <h3 className="font-medium text-emerald-400">{card.title}</h3>
                  <p className="text-sm text-gray-300 mt-1">{card.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center mt-8">
              <div className="bg-white p-4 rounded-2xl shadow-lg">
                <QRCodeSVG value={proofUrl} size={120} includeMargin />
              </div>
              <div className="flex items-center gap-2 mt-3 text-sm text-gray-400">
                <QrCode size={16} />
                <span>Scan to view verified proof record</span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ delay: 2 }}
        className="absolute bottom-6 text-xs text-gray-400 tracking-widest uppercase"
      >
        © 2025 RareEarthMinerals.ai — Proof. Clarity. Comprehension.
      </motion.div>
    </div>
  );
}

