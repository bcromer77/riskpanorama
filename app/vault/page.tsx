// app/vault/page.tsx — The Evidence Vault (Final — Neutral & Deterministic)
//
// This page displays evidence in three factual states:
// ● Verified            (document exists + signature)
// ○ Needs Checking      (document incomplete/inconsistent)
// × Missing Evidence    (document missing/invalid)
//
// FPIC content is NOT interpreted as ethics, conflict, risk, or compliance.
// It is displayed strictly as: Extra Context.
//
// Wording is regulator-safe, tribe-neutral, court-compatible.

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Share2, Fingerprint, Users } from "lucide-react";

type VaultDoc = {
  id: string;
  filename: string;
  uploadedAt: string;
  textPreview: string;
  vaultEventId?: string;
  signatureVerified?: boolean;
  passport?: {
    articles?: { article: string; status: string; note: string }[];
  };
  fpic?: {
    items?: { category: string; text: string; sim?: number }[];
  };
};

// Deterministic Evidence Status Chips
function statusChip(status: string) {
  const s = status.toLowerCase();

  if (s.includes("verified"))
    return (
      <Badge className="bg-emerald-900/40 text-emerald-200 border-emerald-700 text-xs">
        ● Verified
      </Badge>
    );

  if (s.includes("missing"))
    return (
      <Badge className="bg-rose-900/40 text-rose-200 border-rose-700 text-xs">
        × Missing Evidence
      </Badge>
    );

  return (
    <Badge className="bg-amber-900/40 text-amber-200 border-amber-700 text-xs">
      ○ Needs Checking
    </Badge>
  );
}

// Shareable public record link (neutral wording)
function handleShareDoc(id: string, filename: string) {
  const url = `${window.location.origin}/passport/${id}`;
  navigator.clipboard.writeText(url);
  alert(`Share link copied for: ${filename}`);
}

export default function VaultPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<VaultDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/document", { cache: "no-store" });
        const data = await res.json();
        setDocs(data.documents || []);
      } catch (err) {
        console.error("Failed to load vault:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const total = docs.length;
  const verified = docs.filter((d) => d.signatureVerified === true).length;
  const withFPIC = docs.filter((d) => (d.fpic?.items?.length ?? 0) > 0).length;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="space-y-4">
            <h1 className="text-6xl font-black tracking-tighter">The Vault</h1>
            <p className="text-xl text-gray-300 max-w-3xl">
              Signed. Append-only. Evidence that cannot be altered.
            </p>
          </div>
          <div className="mt-8 text-right">
            <p className="text-4xl font-black text-cyan-400">{total} evidence records</p>
            <p className="text-sm text-gray-400">{verified} verified signatures</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-3 gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
          <p className="text-5xl font-black text-emerald-400">{verified}</p>
          <p className="text-sm text-gray-400 mt-2">Verified</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
          <p className="text-5xl font-black text-amber-400">{total - verified}</p>
          <p className="text-sm text-gray-400 mt-2">Needs Checking / Missing</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
          <p className="text-5xl font-black text-cyan-400">{withFPIC}</p>
          <p className="text-sm text-gray-400 mt-2">Extra Context Detected</p>
        </div>
      </div>

      {/* Document List */}
      <div className="max-w-7xl mx-auto px-6 pb-20 space-y-4">
        {loading ? (
          <p className="text-center text-gray-400 py-20">Loading vault…</p>
        ) : docs.length === 0 ? (
          <Card className="bg-zinc-900/50 border-zinc-800 p-20 text-center space-y-4">
            <FileText className="w-16 h-16 text-gray-600 mx-auto" />
            <p className="text-xl text-gray-300">No evidence records yet</p>
            <p className="text-sm text-gray-500">
              Upload in Instrument → records appear here as immutable evidence.
            </p>
          </Card>
        ) : (
          docs.map((doc) => (
            <Card
              key={doc.id}
              className="bg-zinc-900/50 border border-zinc-800 hover:border-cyan-500/70 transition-all"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold flex items-center gap-3">
                      {doc.signatureVerified && (
                        <Fingerprint className="w-5 h-5 text-cyan-400" />
                      )}
                      {doc.filename}
                    </CardTitle>
                    <p className="text-xs text-gray-500">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                      {doc.vaultEventId ? ` — ${doc.vaultEventId.slice(-8)}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {doc.fpic?.items?.length ? (
                      <Badge className="bg-cyan-900/60 text-cyan-300 border-cyan-700 text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        Extra Context
                      </Badge>
                    ) : null}
                    {doc.signatureVerified && (
                      <Badge className="bg-emerald-900/60 text-emerald-300 border-emerald-700 text-xs">
                        Signed
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-gray-400 line-clamp-2">
                  {doc.textPreview || "No preview available"}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {doc.passport?.articles?.map((a, i) => (
                      <React.Fragment key={i}>{statusChip(a.status)}</React.Fragment>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-cyan-400 hover:text-white"
                      onClick={() => handleShareDoc(doc.id, doc.filename)}
                    >
                      <Share2 className="w-3 h-3 mr-1" />
                      Share
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => router.push(`/passport/${doc.id}`)}
                    >
                      View Record
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center">
          <p className="text-sm font-medium text-gray-400">
            Evidence slots are append-only.  
            Signatures verify existence — not compliance or interpretation.
          </p>
        </div>
      </div>
    </div>
  );
}

