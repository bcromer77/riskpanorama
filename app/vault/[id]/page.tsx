"use client";

import React, { useEffect, useState } from "react";
import { use } from "react";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Article = {
  article: string;
  status: string;
  note: string;
};

type FPICItem = {
  category: string;
  text: string;
  sim?: number;
};

type VaultDoc = {
  id: string;
  filename: string;
  uploadedAt: string;
  textPreview: string;
  hash?: string;
  passport?: {
    articles?: Article[];
  };
  fpic?: {
    items?: FPICItem[];
  };
};

export default function VaultViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const router = useRouter();
  const [doc, setDoc] = useState<VaultDoc | null>(null);
  const [qr, setQr] = useState<string>("");

  const chip = (status: string) => {
    const s = status.toLowerCase();
    if (s === "verified")
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    if (s === "needs review")
      return "bg-amber-50 text-amber-700 border border-amber-200";
    if (s === "missing evidence" || s === "gap")
      return "bg-rose-50 text-rose-700 border border-rose-200";
    return "bg-slate-100 text-slate-700 border border-slate-200";
  };

  useEffect(() => {
    async function loadDoc() {
      try {
        const res = await fetch(`/api/vault/${id}`, { cache: "no-store" });
        const data = await res.json();
        setDoc(data);

        const url =
          typeof window !== "undefined"
            ? window.location.href
            : `https://rareearthminerals.ai/vault/${id}`;

        const img = await QRCode.toDataURL(url, { width: 200, margin: 1 });
        setQr(img);
      } catch (err) {
        console.error("Failed to load vault entry:", err);
      }
    }
    loadDoc();
  }, [id]);

  if (!doc) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-20">
        <p className="text-slate-400 text-sm">Loading vault record…</p>
      </main>
    );
  }

  const uploaded =
    doc.uploadedAt && !Number.isNaN(Date.parse(doc.uploadedAt))
      ? new Date(doc.uploadedAt).toLocaleString()
      : "—";

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Vault Record</h1>
          <p className="text-sm text-slate-500">
            Supplier documentation — evidence readiness snapshot
          </p>

          {/* 🔒 Integrity Badge */}
          {doc.hash && (
            <Badge className="bg-emerald-900/40 text-emerald-300 border border-emerald-600 text-[11px] font-medium mt-1 flex items-center gap-1.5 w-fit">
              <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
              Integrity: Verified
            </Badge>
          )}
          {!doc.hash && (
            <Badge className="bg-gray-800 text-gray-300 border border-gray-700 text-[11px] font-medium mt-1 flex items-center gap-1.5 w-fit">
              <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
              Integrity: Pending
            </Badge>
          )}
        </div>

        {qr && (
          <img
            src={qr}
            alt="QR Code"
            className="w-28 h-28 rounded-lg border bg-white"
          />
        )}
      </header>

      {/* File identity */}
      <section className="bg-white border rounded-2xl p-6 shadow-sm space-y-2">
        <h2 className="text-sm font-semibold text-slate-800">Document Overview</h2>
        <p className="text-sm text-slate-700 flex flex-col gap-1">
          <span><strong>Filename:</strong> {doc.filename}</span>
          <span><strong>Uploaded:</strong> {uploaded}</span>
          <span><strong>Record ID:</strong> <span className="font-mono">{doc.id}</span></span>
        </p>
        <p className="mt-3 text-sm text-slate-600">
          <strong>Preview:</strong> {doc.textPreview || "—"}
        </p>
      </section>

      {/* Battery Passport */}
      <section className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">Battery Regulation Readiness</h2>

        {(doc.passport?.articles ?? []).length === 0 && (
          <p className="text-sm text-slate-500">No documented readiness data.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {doc.passport?.articles?.map((a) => (
            <div key={a.article} className={`rounded-xl p-4 border ${chip(a.status)} space-y-1`}>
              <p className="text-sm font-medium">{a.article.replace("Article", "Art.")}</p>
              <p className="text-xs opacity-80">{a.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FPIC Signals */}
      <section className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">Community & Consultation Language</h2>

        {(doc.fpic?.items ?? []).length === 0 && (
          <p className="text-sm text-slate-500">No community consultation language detected.</p>
        )}

        <div className="space-y-3">
          {doc.fpic?.items?.map((item, idx) => (
            <div key={idx} className="rounded-xl border bg-violet-50 p-4 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <Badge className="bg-violet-200 text-violet-900 text-[10px]">{item.category}</Badge>
                {item.sim && (
                  <span className="text-[10px] text-slate-500">
                    relevance {Math.round(item.sim * 100)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 leading-snug">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-3">
        <Button className="bg-slate-900 text-white text-sm hover:bg-slate-800" onClick={() => window.print()}>
          Download / Print
        </Button>
        <Button variant="outline" className="text-sm" onClick={() => window.open(`/api/vault/${doc.id}`, "_blank")}>
          View JSON
        </Button>
        <Button variant="outline" className="text-sm" onClick={() => router.push("/vault")}>
          ← Back to Vault
        </Button>
      </div>
    </main>
  );
}

