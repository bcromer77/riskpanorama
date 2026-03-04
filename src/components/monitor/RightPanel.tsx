"use client";

import { useEffect, useMemo, useState } from "react";
import type { EventPack, ChronozoneSignal } from "@/lib/api";

function formatTs(ts: string | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type TabKey = "exposure" | "decision" | "reality" | "satellite" | "radar";

interface RightPanelProps {
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  pack?: EventPack | null;
  packLoading: boolean;
  packError?: string | null;
  satDate: string;
  setSatDate: (date: string) => void;
}

export default function RightPanel({
  selectedEventId,
  setSelectedEventId,
  pack,
  packLoading,
  packError,
  satDate,
  setSatDate,
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("exposure");

  // ── Reality tab states ──
  const [liveMode, setLiveMode] = useState(true);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [useScrubber, setUseScrubber] = useState(true);
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);

  // Local signals state (updated by polling or initial pack)
  const [signals, setSignals] = useState<ChronozoneSignal[]>(pack?.signals || []);

  // Sync signals when pack changes
  useEffect(() => {
    if (pack?.signals) {
      setSignals(pack.signals);
    }
  }, [pack?.signals]);

  // ── Live polling: refetch pack every 45s when live mode is on ──
  useEffect(() => {
    if (!liveMode || packLoading || !selectedEventId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/v1/chronozone/events/${selectedEventId}/pack`);
        if (!res.ok) throw new Error("Poll failed");
        const newPack: EventPack = await res.json();

        // Merge new signals (safe de-dupe even if id missing)
        setSignals((prev) => {
          const sigKey = (s: ChronozoneSignal) =>
            s.id || `${s.time}-${s.sourceType}-${(s.text || "").slice(0, 40)}`;
          const existing = new Set(prev.map(sigKey));
          const incoming = (newPack.signals || []).filter((s) => !existing.has(sigKey(s)));
          if (incoming.length === 0) return prev;
          console.log(`Live update: ${incoming.length} new signals`);
          return [...prev, ...incoming].sort(
            (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
          );
        });
      } catch (err) {
        console.error("Live poll error:", err);
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [liveMode, packLoading, selectedEventId]);

  // ── Time cursor follows satDate when not live ──
  const cursorEndTs = useMemo(() => {
    if (liveMode) return Infinity; // live always shows all/latest
    return new Date(`${satDate}T23:59:59Z`).getTime();
  }, [liveMode, satDate]);

  const filteredSignals = useMemo(
    () => signals.filter((s) => new Date(s.time).getTime() <= cursorEndTs),
    [signals, cursorEndTs]
  );

  const displaySignals = useMemo(() => {
    let list = liveMode ? signals.slice().reverse() : filteredSignals.slice().reverse();
    if (filterTag) {
      list = list.filter((s) => s.tags?.includes(filterTag));
    }
    return list;
  }, [liveMode, filteredSignals, signals, filterTag]);

  const hasAbsence = useMemo(() => {
    const last = signals[signals.length - 1]?.time;
    if (!last) return false;
    const hoursSinceLast = (Date.now() - new Date(last).getTime()) / 3600000;
    return hoursSinceLast > 24;
  }, [signals]);

  const convergence = useMemo(() => {
    const sig = signals;
    const sources = new Set(sig.map((s) => s.sourceType).filter(Boolean));
    const sourced = sig.filter((s) => !!s.sourceRef).length;
    const score = sources.size * 20 + Math.min(60, sourced * 10); // capped
    const label = score >= 80 ? "HIGH" : score >= 50 ? "MEDIUM" : "LOW";
    const className =
      score >= 80
        ? "bg-emerald-100 text-emerald-800"
        : score >= 50
        ? "bg-amber-100 text-amber-800"
        : "bg-slate-100 text-slate-700";
    return { sources: [...sources], sourceCount: sources.size, sourcedCount: sourced, score, label, className };
  }, [signals]);

  const filterByTag = (tag: string) => {
    setFilterTag((prev) => (prev === tag ? null : tag));
  };

  const exportVisibleSignals = () => {
    const csvContent = [
      ["Time", "Source", "Confidence", "Text", "Tags", "Source Ref"],
      ...displaySignals.map((s) => [
        formatTs(s.time),
        s.sourceType,
        s.confidence,
        `"${(s.text || "").replace(/"/g, '""')}"`,
        (s.tags || []).join(", "),
        s.sourceRef || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chronozone_signals_${pack?.event?.id || "event"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Risk scores for radar (demo-safe) ──
  const risk = useMemo(() => {
    const sev = pack?.event?.severity;
    const severity =
      sev === "high" ? 85 : sev === "medium" ? 60 : sev === "low" ? 35 : 50;

    const sig = signals || [];
    const uniqueSources = new Set(sig.map((s) => s.sourceType).filter(Boolean)).size;
    const highConf = sig.filter((s) => s.confidence === "high").length;
    const sourced = sig.filter((s) => !!s.sourceRef).length;

    const probability = clamp(uniqueSources * 18 + highConf * 6, 10, 95);
    const confidence = clamp(uniqueSources * 15 + Math.min(40, sourced), 15, 95);

    return { probability, severity, confidence };
  }, [pack?.event?.severity, signals]);

  // ── Auto-scroll to latest in live mode ──
  useEffect(() => {
    if (liveMode) {
      const container = document.querySelector(".overflow-y-auto");
      if (container) container.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [liveMode, displaySignals]);

  // ── Derived UI values ──
  const event = pack?.event;
  const title = event?.title || (packLoading ? "Loading event…" : "No event selected");
  const hasData = !!pack && !packLoading && !packError;

  return (
    <aside className="w-[560px] flex-shrink-0 border-l border-slate-200 bg-white overflow-y-auto">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 font-medium">Chronozone Event</div>
          <h1 className="text-2xl font-bold text-slate-900 truncate max-w-[340px] mt-1">{title}</h1>
          {event && (
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-600">
              {event.category && (
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                  {event.category}
                </span>
              )}
              {event.severity && (
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    event.severity === "high"
                      ? "bg-red-100 text-red-700"
                      : event.severity === "medium"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {event.severity.toUpperCase()}
                </span>
              )}
              {event.startTime && <span>Started: {formatTs(event.startTime)}</span>}
            </div>
          )}
          {hasData && (
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${convergence.className}`}>
                Convergence: {convergence.label}
              </span>
              <span className="text-xs text-slate-600">
                {convergence.sourceCount} sources • {convergence.sourcedCount} links
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {hasData && (
            <button
              onClick={exportVisibleSignals}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Export Signals
            </button>
          )}
          <button
            onClick={() => setSelectedEventId(null)}
            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close panel"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-10">
        {/* Loading / Error / Empty */}
        {packLoading && (
          <div className="space-y-8">
            <div className="h-10 bg-slate-200 rounded-xl animate-pulse" />
            <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {packError && (
          <div className="p-8 bg-red-50 border border-red-200 rounded-2xl text-center">
            <div className="text-xl font-semibold text-red-800 mb-3">Failed to load event pack</div>
            <div className="text-red-700">{packError}</div>
          </div>
        )}

        {!selectedEventId && !packLoading && !packError && (
          <div className="py-24 text-center text-slate-500">
            <div className="text-7xl mb-6 opacity-30">🌍</div>
            <h3 className="text-2xl font-semibold text-slate-700 mb-4">Select an Event</h3>
            <p className="max-w-md mx-auto text-slate-600">
              Click any marker or event in the list to view exposure assessment, decision risks, observed reality, and satellite context.
            </p>
          </div>
        )}

        {pack && !packLoading && !packError && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-slate-200 -mx-6 px-6">
              {(["exposure", "decision", "reality", "satellite", "radar"] as TabKey[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 py-4 text-center text-sm font-medium transition-colors border-b-2 ${
                    activeTab === t
                      ? "border-blue-600 text-blue-700 font-semibold"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                  }`}
                >
                  {t === "exposure"
                    ? "Exposure"
                    : t === "decision"
                    ? "Decision Risk"
                    : t === "reality"
                    ? "Reality"
                    : t === "satellite"
                    ? "Satellite"
                    : "Radar"}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="pt-6 space-y-10">
              {activeTab === "reality" && (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        Intelligence Feed
                        <span className="text-sm font-normal text-slate-500">(real-time)</span>
                      </h2>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={liveMode}
                            onChange={(e) => {
                              const on = e.target.checked;
                              setLiveMode(on);
                              setExpandedSignal(null);
                              if (on) {
                                setUseScrubber(false);
                              } else {
                                setUseScrubber(true);
                              }
                            }}
                            className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                          <span className={liveMode ? "font-medium text-blue-700" : "text-slate-600"}>Live</span>
                        </label>

                        <button
                          onClick={exportVisibleSignals}
                          className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          Export CSV
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-5 gap-3 mb-6 text-center">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="text-xl font-bold text-slate-900">{signals.length}</div>
                        <div className="text-xs text-slate-600">Total</div>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <div className="text-xl font-bold text-emerald-700">
                          {signals.filter((s) => s.confidence === "high").length}
                        </div>
                        <div className="text-xs text-emerald-800">High</div>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <div className="text-xl font-bold text-amber-700">
                          {signals.filter((s) => s.sourceType === "x").length}
                        </div>
                        <div className="text-xs text-amber-800">X</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="text-xl font-bold text-blue-700">
                          {signals.filter((s) => s.sourceRef).length}
                        </div>
                        <div className="text-xs text-blue-800">Sourced</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                        <div className="text-xl font-bold text-purple-700">
                          {new Set(signals.flatMap((s) => s.tags || [])).size}
                        </div>
                        <div className="text-xs text-purple-800">Tags</div>
                      </div>
                    </div>

                    {/* Scrubber placeholder – add real logic if needed */}
                    <div className="mb-6 p-5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-base font-semibold text-slate-900">Timeline Scrubber</div>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={useScrubber}
                            onChange={(e) => setUseScrubber(e.target.checked)}
                            disabled={liveMode}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                          />
                          Use time filter
                        </label>
                      </div>

                      {liveMode && (
                        <div className="mt-3 text-sm text-slate-600">
                          Live mode shows latest signals (turn Live off to scrub the timeline).
                        </div>
                      )}
                    </div>

                    {/* Living signal feed – cleaned version */}
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scroll-smooth">
                      {displaySignals.length > 0 ? (
                        displaySignals.map((s, idx) => {
                          const sid = s.id || `${s.time}-${s.sourceType}-${(s.text || "").slice(0, 40)}`;
                          const isLatest = liveMode && idx === 0;
                          const isExpanded = expandedSignal === sid;

                          const cardClass =
                            "p-5 rounded-xl border transition-all duration-500 cursor-pointer group " +
                            (isLatest
                              ? "border-blue-400 bg-blue-50/30 animate-pulse-slow shadow-lg scale-[1.02]"
                              : "border-slate-200 hover:border-slate-300 bg-white");

                          return (
                            <div
                              key={sid}
                              onClick={() => {
                                const d = new Date(s.time);
                                setSatDate(d.toISOString().slice(0, 10));
                                setExpandedSignal((prev) => (prev === sid ? null : sid));
                              }}
                              className={cardClass}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <time className="font-semibold text-slate-900">{formatTs(s.time)}</time>
                                    {isLatest && (
                                      <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 animate-pulse">
                                        Latest
                                      </span>
                                    )}
                                  </div>

                                  <p className={"text-slate-700 " + (isExpanded ? "" : "line-clamp-3")}>
                                    {s.text}
                                  </p>

                                  {s.evidence && (
                                    <div className="mt-3 text-xs text-slate-600 flex flex-wrap gap-4">
                                      {s.evidence.kind && <span>Kind: {String(s.evidence.kind).toUpperCase()}</span>}
                                      {s.evidence.capturedAt && (
                                        <span>🛰️ Captured: {formatTs(s.evidence.capturedAt)}</span>
                                      )}
                                      {s.evidence.cloudPct != null && <span>Cloud: {s.evidence.cloudPct}%</span>}
                                      {s.evidence.previewUrl && (
                                        <a
                                          href={s.evidence.previewUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          Preview →
                                        </a>
                                      )}
                                    </div>
                                  )}

                                  {s.tags?.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                      {s.tags.map((tag) => (
                                        <button
                                          key={tag}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            filterByTag(tag);
                                          }}
                                          className={
                                            "px-2.5 py-1 text-xs rounded-full border transition-colors " +
                                            (filterTag === tag
                                              ? "bg-slate-800 text-white border-slate-800"
                                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100")
                                          }
                                        >
                                          {tag}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col items-end gap-3">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                                      {String(s.sourceType).toUpperCase()}
                                    </span>
                                    <span
                                      className={
                                        "px-2.5 py-1 text-xs font-medium rounded-full " +
                                        (s.confidence === "high"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : s.confidence === "medium"
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-slate-100 text-slate-700")
                                      }
                                    >
                                      {String(s.confidence).toUpperCase()}
                                    </span>
                                  </div>

                                  <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {s.sourceRef && (
                                      <a
                                        href={s.sourceRef}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        Source →
                                      </a>
                                    )}

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedSignal((prev) => (prev === sid ? null : sid));
                                      }}
                                      className="text-sm text-slate-500 hover:text-slate-700"
                                    >
                                      {isExpanded ? "Collapse" : "Expand"}
                                    </button>

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(s.text);
                                      }}
                                      className="text-sm text-slate-500 hover:text-slate-700"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
                          No signals match current view.
                        </div>
                      )}
                    </div>

                    {/* Absence alert */}
                    {hasAbsence && (
                      <div className="mt-6 p-5 bg-amber-50 rounded-xl border border-amber-200 text-amber-800">
                        <div className="font-semibold mb-1">Absence Alert</div>
                        <div className="text-sm">
                          No new signals in the last 24 hours — unusual silence. Monitor for withdrawal or delayed reporting.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "radar" && (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Decision Radar</h2>
                    <p className="text-sm text-slate-600 mb-6">
                      Probability vs Severity with confidence ring (evidence strength).
                    </p>

                    <div className="mt-6">
                      <RiskPlane
                        probability={risk.probability}
                        severity={risk.severity}
                        confidence={risk.confidence}
                      />
                    </div>

                    <div className="mt-5 text-sm text-slate-600">
                      <b>How to read:</b> further right = more likely, higher = more severe. Bigger ring = stronger evidence.
                    </div>
                  </div>
                </div>
              )}

              {/* Placeholder for other tabs – implement as needed */}
              {activeTab === "exposure" && <div>Exposure assessment content (TBD)</div>}
              {activeTab === "decision" && <div>Decision risk content (TBD)</div>}
              {activeTab === "satellite" && <div>Satellite viewer / timeline (TBD)</div>}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

// Simple RiskPlane component (unchanged)
function RiskPlane({
  probability,
  severity,
  confidence,
}: {
  probability: number;
  severity: number;
  confidence: number;
}) {
  const w = 520;
  const h = 320;
  const pad = 36;

  const x = pad + ((w - pad * 2) * clamp(probability, 0, 100)) / 100;
  const y = h - pad - ((h - pad * 2) * clamp(severity, 0, 100)) / 100;

  const ring = 10 + (clamp(confidence, 0, 100) / 100) * 22;

  return (
    <svg width={w} height={h} className="bg-slate-50 rounded-xl border border-slate-200">
      {/* Axes */}
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#94a3b8" />
      <line x1={pad} y1={h - pad} x2={pad} y2={pad} stroke="#94a3b8" />

      {/* Labels */}
      <text x={pad - 30} y={pad + 5} fontSize="12" fill="#334155">
        Severity ↑
      </text>
      <text x={w - pad - 80} y={h - pad + 18} fontSize="12" fill="#334155">
        Probability →
      </text>

      {/* Point + ring */}
      <circle cx={x} cy={y} r={6} fill="#2563eb" />
      <circle cx={x} cy={y} r={ring} fill="none" stroke="#2563eb" strokeOpacity={0.3} strokeWidth={3} />
    </svg>
  );
}
