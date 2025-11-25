"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

// -----------------------------------
// Types matching the /api/document response structure
// -----------------------------------
type Article = {
  article: string;
  status: string;
  note: string;
};

type VaultDoc = {
  id: string;
  filename: string;
  uploadedAt: string | null;
  textPreview: string;
  hash: string | null; // Added for UI display
  passport: {
    articles?: Article[];
  } | null;
  fpic: {
    items?: {
      category: string;
      text: string;
      sim?: number;
    }[];
  } | null;
};

// -----------------------------------
// Helpers
// -----------------------------------

// Helper to determine badge style based on article status
function statusChip(status: string) {
  const s = status.toLowerCase();
  
  if (s === "compliant") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 mr-1" /> Compliant
      </span>
    );
  }
  if (s === "needs review" || s === "needs validation") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200">
        <AlertCircle className="w-3 h-3 mr-1" /> Needs Review
      </span>
    );
  }
  if (s === "gap" || s === "missing evidence") {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 border border-rose-200">
        <X className="w-3 h-3 mr-1" /> Gap
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200">
      {status}
    </span>
  );
}

// Helper to display FPIC presence
function fpicBadge(doc: VaultDoc) {
  const count = doc.fpic?.items?.length ?? 0;
  if (count === 0) {
    return (
      <Badge className="bg-slate-800 text-[10px] font-normal text-slate-200">
        No FPIC signals
      </Badge>
    );
  }
  return (
    <Badge className="bg-violet-100 text-violet-900 text-[10px] font-medium border border-violet-400">
      FPIC / Indigenous: {count} signals
    </Badge>
  );
}

// -----------------------------------
// Main Component
// -----------------------------------
export default function VaultPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<VaultDoc[]>([]);
  const [filtered, setFiltered] = useState<VaultDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "compliant" | "gaps" | "fpic">(
    "all"
  );

  // 1. Fetch data from the secure, multi-tenant API
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/document", { cache: "no-store" }); 
        
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          // CRITICAL: A 401 means the user needs to re-auth
          if (res.status === 401) throw new Error("Session expired. Please log in again.");
          throw new Error(data.error || `Failed with ${res.status}`);
        }
        
        const data = await res.json();
        const docsData: VaultDoc[] = data.documents || [];
        setDocs(docsData);
        setFiltered(docsData);
        
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load vault. Check network and login status.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // 2. Client-side Filtering Logic (reacts to query/filter state)
  useEffect(() => {
    let next = [...docs];
    
    // Apply search query filter
    if (query.trim()) {
      const q = query.toLowerCase();
      next = next.filter((d) =>
        [d.filename, d.textPreview, d.hash].some((t) =>
          (t || "").toLowerCase().includes(q)
        )
      );
    }
    
    // Apply status filter
    if (filter === "compliant") {
      // Document must have articles AND all articles must be compliant
      next = next.filter((d) => {
        const articles = d.passport?.articles ?? [];
        return (
          articles.length > 0 &&
          articles.every((a) => a.status.toLowerCase() === "compliant")
        );
      });
    } else if (filter === "gaps") {
      // Document must have at least one gap status
      next = next.filter((d) =>
        (d.passport?.articles ?? []).some(
          (a) => a.status.toLowerCase() === "gap" || a.status.toLowerCase() === "missing evidence"
        )
      );
    } else if (filter === "fpic") {
      // Document must have at least one FPIC signal detected
      next = next.filter((d) => (d.fpic?.items?.length ?? 0) > 0);
    }
    setFiltered(next);
  }, [docs, query, filter]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-xs font-semibold tracking-tight">
              REM
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-slate-50">
                Vault
              </h1>
              <p className="text-xs text-slate-400">
                Secure Evidence Vault · Immutable audit trail for your organization.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-slate-700 bg-slate-900 text-xs text-slate-200"
              onClick={() => router.push("/instrument")}
            >
              ← Back to Instrument
            </Button>
          </div>
        </div>
      </header>
      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-4">
        {/* Page header controls */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-50">
              Battery Passport & FPIC Vault
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              One command centre: view and share sealed supplier evidence with auditors, retailers, and counsel.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="Search filename, preview text, or hash ID…"
              className="border-slate-700 bg-slate-950/70 text-xs w-full sm:w-56"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="flex gap-1 justify-end">
              <Button
                size="sm"
                variant={filter === "all" ? "default" : "outline"}
                className={
                  filter === "all"
                    ? "bg-slate-100 text-slate-900 text-[11px]"
                    : "border-slate-700 text-[11px] text-slate-200 bg-slate-900"
                }
                onClick={() => setFilter("all")}
              >
                All ({docs.length})
              </Button>
              <Button
                size="sm"
                variant={filter === "compliant" ? "default" : "outline"}
                className={
                  filter === "compliant"
                    ? "bg-emerald-500 text-emerald-950 text-[11px]"
                    : "border-slate-700 text-[11px] text-slate-200 bg-slate-900"
                }
                onClick={() => setFilter("compliant")}
              >
                Fully compliant
              </Button>
              <Button
                size="sm"
                variant={filter === "gaps" ? "default" : "outline"}
                className={
                  filter === "gaps"
                    ? "bg-rose-500 text-rose-50 text-[11px]"
                    : "border-slate-700 text-[11px] text-slate-200 bg-slate-900"
                }
                onClick={() => setFilter("gaps")}
              >
                Gaps
              </Button>
              <Button
                size="sm"
                variant={filter === "fpic" ? "default" : "outline"}
                className={
                  filter === "fpic"
                    ? "bg-violet-500 text-violet-50 text-[11px]"
                    : "border-slate-700 text-[11px] text-slate-200 bg-slate-900"
                }
                onClick={() => setFilter("fpic")}
              >
                FPIC signals
              </Button>
            </div>
          </div>
        </div>
        
        {/* Status Indicators */}
        <div className="flex items-center justify-between">
          <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/50 text-[10px]">
            Live Multi-Tenant Vault
          </Badge>
          <p className="text-[11px] text-slate-500">
            {filtered.length} document{filtered.length === 1 ? "" : "s"} shown
          </p>
        </div>
        
        {/* Loading and Error States */}
        {loading && (
          <p className="text-xs text-slate-500 mt-2">Loading vault…</p>
        )}
        {error && (
          <p className="text-xs text-rose-300 border border-rose-500/50 bg-rose-500/10 rounded-lg px-3 py-2 mt-2">
            {error}
          </p>
        )}
        {!loading && !error && filtered.length === 0 && (
          <p className="text-xs text-slate-500 mt-2">
            No documents match this view. Upload a PDF in the Instrument workspace (Art. 7, 8, 10, 12, 13, 39 classified) and it will appear here automatically.
          </p>
        )}
        
        {/* Document List */}
        <div className="space-y-3 mt-2">
          {filtered.map((doc) => {
            const articles = doc.passport?.articles ?? [];
            const uploaded =
              doc.uploadedAt && !Number.isNaN(Date.parse(doc.uploadedAt))
                ? new Date(doc.uploadedAt).toLocaleDateString()
                : "—";
            const hasGap = articles.some(
              (a) => a.status.toLowerCase() === "gap" || a.status.toLowerCase() === "missing evidence"
            );
            const allCompliant =
              articles.length > 0 &&
              articles.every((a) => a.status.toLowerCase() === "compliant");
            
            return (
              <Card
                key={doc.id}
                className="border-slate-800 bg-slate-900/70 hover:border-emerald-500/60 transition-colors cursor-pointer"
                onClick={() => router.push(`/vault/${doc.id}`)}
              >
                <CardHeader className="pb-2 flex flex-row items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-semibold text-slate-50">
                      {doc.filename}
                    </CardTitle>
                    <p className="text-[11px] text-slate-500">
                      Uploaded: {uploaded} · Hash ID{" "}
                      <span className="font-mono text-slate-400">
                        {doc.hash ? doc.hash.slice(0, 6) : "—"}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400 line-clamp-2 max-w-xl">
                      {doc.textPreview || "No preview available."}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {fpicBadge(doc)}
                    {allCompliant && (
                      <Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/50 text-[10px]">
                        Ready for retailer / OEM
                      </Badge>
                    )}
                    {hasGap && !allCompliant && (
                      <Badge className="bg-rose-500/15 text-rose-300 border border-rose-400/60 text-[10px]">
                        Needs remediation
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {articles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {articles.map((a, idx) => (
                        <span key={idx} className="text-[10px] uppercase font-medium">
                          {a.article.replace("Article", "Art.")}: {statusChip(a.status)}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
                    <p className="text-[11px] text-slate-500 max-w-md">
                      Snapshot of {articles.length} mandatory articles & FPIC signals — the raw material for a verifiable battery passport.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-slate-700 text-[11px] text-slate-100"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          router.push(`/vault/${doc.id}`);
                        }}
                      >
                        Open Vault Record
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400 text-[11px]"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          window.open(`/api/vault/${doc.id}`, "_blank");
                        }}
                      >
                        View Full JSON
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
