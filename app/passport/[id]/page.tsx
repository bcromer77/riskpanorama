// app/passport/[id]/page.tsx
// Neutral Evidence Record Page (Verified · Needs Checking · Missing Evidence)
// No compliance claims. No ESG scoring. No legal interpretation.
// Safe for regulators, tribes, suppliers, auditors, insurers.

"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Fingerprint, Users, ArrowLeft } from "lucide-react";

// -------------------------------
// Types (matching normalized API)
// -------------------------------
type EvidenceItem = {
  article: string;
  status: "verified" | "missing" | "checking";
  note?: string;
};

type RecordType = {
  record_id: string;
  filename: string;
  uploadedAt: string;
  textPreview?: string;
  signatureVerified?: boolean;
  vaultEventId?: string | null;
  evidence: EvidenceItem[];
  extraContext: { text: string }[];
};

// -------------------------------
// Deterministic Status Chip
// -------------------------------
function statusChip(status: string) {
  const s = status.toLowerCase();

  if (s === "verified")
    return (
      <Badge className="bg-emerald-900/40 text-emerald-200 border border-emerald-700 text-xs">
        ● Verified
      </Badge>
    );

  if (s === "missing")
    return (
      <Badge className="bg-rose-900/40 text-rose-200 border border-rose-700 text-xs">
        × Missing Evidence
      </Badge>
    );

  return (
    <Badge className="bg-amber-900/40 text-amber-200 border border-amber-700 text-xs">
      ○ Needs Checking
    </Badge>
  );
}

// -------------------------------
// Page Component
// -------------------------------
export default function PassportPage() {
  const params = useParams();
  const id = params.id as string;
  const [record, setRecord] = useState<RecordType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/passport/${id}?role=public`, {
          cache: "no-store",
        });
        const data = await res.json();
        setRecord(data || null);
      } catch (err) {
        console.error("Passport load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // -------------------------------
  // Loading & Error States
  // -------------------------------
  if (loading)
    return (
      <div className="min-h-screen bg-black text-gray-300 flex items-center justify-center">
        Loading record…
      </div>
    );

  if (!record)
    return (
      <div className="min-h-screen bg-black text-gray-300 flex items-center justify-center">
        Record not found.
      </div>
    );

  // -------------------------------
  // Main UI
  // -------------------------------
  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      {/* Back button */}
      <Button
        variant="ghost"
        className="text-gray-400 hover:text-white mb-6"
        onClick={() => history.back()}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Vault
      </Button>

      {/* Header */}
      <div className="space-y-1 mb-10">
        <h1 className="text-4xl font-black tracking-tight">{record.filename}</h1>

        <p className="text-sm text-gray-500">
          Uploaded {new Date(record.uploadedAt).toLocaleString()}
          {record.vaultEventId ? ` — ${record.vaultEventId.slice(-8)}` : ""}
        </p>

        <div className="flex items-center gap-2 mt-3">
          {record.signatureVerified && (
            <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-700 text-xs">
              <Fingerprint className="w-3 h-3 mr-1" />
              Signed
            </Badge>
          )}

          {record.extraContext?.length > 0 && (
            <Badge className="bg-cyan-900/50 text-cyan-300 border-cyan-700 text-xs">
              <Users className="w-3 h-3 mr-1" />
              Extra Context
            </Badge>
          )}
        </div>
      </div>

      {/* Evidence Summary */}
      <Card className="bg-zinc-900/40 border border-zinc-800 mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Evidence Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm">
            This record shows only which evidence exists, needs checking, or is missing.
            No interpretation, risk scoring, or compliance decisions are made here.
          </p>
        </CardContent>
      </Card>

      {/* Evidence Items */}
      <Card className="bg-zinc-900/40 border border-zinc-800 mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Evidence Checks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {record.evidence.map((e, i) => (
            <div key={i} className="flex items-start justify-between py-1">
              <div>
                <p className="text-sm font-medium">{e.article}</p>
                {e.note && <p className="text-xs text-gray-500 mt-0.5">{e.note}</p>}
              </div>
              <div>{statusChip(e.status)}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Extra Context */}
      {record.extraContext?.length > 0 && (
        <Card className="bg-zinc-900/40 border border-zinc-800 mb-10">
          <CardHeader>
            <CardTitle className="text-xl">Extra Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {record.extraContext.map((item, i) => (
              <p key={i} className="text-sm text-gray-300">
                {item.text}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Text Preview */}
      <Card className="bg-zinc-900/40 border border-zinc-800">
        <CardHeader>
          <CardTitle className="text-xl">Document Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-300 whitespace-pre-line">
            {record.textPreview || "No preview available"}
          </p>
        </CardContent>
      </Card>

      <div className="h-20" />
    </div>
  );
}

