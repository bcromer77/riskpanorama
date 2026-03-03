"use client";

import { useEffect, useMemo, useState } from "react";
import type { EventPack } from "@/lib/api";

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

type TabKey = "exposure" | "decision" | "reality" | "satellite";

interface RightPanelProps {
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  pack?: EventPack | null;
  packLoading: boolean;
  packError?: string | null;
}

export default function RightPanel({
  selectedEventId,
  setSelectedEventId,
  pack,
  packLoading,
  packError,
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("exposure");

  // ── Reality tab states ──
  const [liveMode, setLiveMode] = useState(true);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [useScrubber, setUseScrubber] = useState(true);
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);

  // ── Chronology scrubber ──
  const signals = useMemo(
    () => (pack?.signals || []).slice().sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()),
    [pack]
  );

  const minTime = signals[0] ? new Date(signals[0].time).getTime() : Date.now();
  const maxTime = signals[signals.length - 1] ? new Date(signals[signals.length - 1].time).getTime() : Date.now();
  const [scrubPct, setScrubPct] = useState(100);

  const currentTime = useMemo(() => {
    if (!signals.length) return maxTime;
    const p = clamp(scrubPct, 0, 100) / 100;
    return Math.round(minTime + (maxTime - minTime) * p);
  }, [scrubPct, minTime, maxTime, signals.length]);

  const filteredSignals = useMemo(
    () => signals.filter((s) => new Date(s.time).getTime() <= currentTime),
    [signals, currentTime]
  );

  // ── Display signals logic ──
  const displaySignals = useMemo(() => {
    let list = liveMode ? signals.slice().reverse() : filteredSignals;
    if (filterTag) {
      list = list.filter((s) => s.tags?.includes(filterTag));
    }
    return list;
  }, [liveMode, filteredSignals, signals, filterTag]);

  // ── Absence detection ──
  const hasAbsence = useMemo(() => {
    const last = signals[signals.length - 1]?.time;
    if (!last) return false;
    const hoursSinceLast = (Date.now() - new Date(last).getTime()) / 3600000;
    return hoursSinceLast > 24;
  }, [signals]);

  // ── Tag filter handler ──
  const filterByTag = (tag: string) => {
    setFilterTag((prev) => (prev === tag ? null : tag));
  };

  // ── Export visible signals to CSV ──
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
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chronozone_signals_${pack?.event?.id || "event"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Live polling (new signals every 45 seconds when live) ──
  useEffect(() => {
    if (!liveMode || packLoading || !selectedEventId) return;

    const interval = setInterval(async () => {
      try {
        // Replace with your actual fetch logic or refetch from useEventPack hook
        const res = await fetch(`/v1/chronozone/events/${selectedEventId}/pack`);
        if (!res.ok) throw new Error("Poll failed");
        const newPack = await res.json();
        console.log("Live update: new signals received", newPack.signals?.length);
        // If your hook supports refetch, call it here instead
      } catch (err) {
        console.error("Live poll error:", err);
      }
    }, 45000); // 45 seconds

    return () => clearInterval(interval);
  }, [liveMode, packLoading, selectedEventId]);

  // ── Derived UI values ──
  const event = pack?.event;
  const title = event?.title || (packLoading ? "Loading event…" : "No event selected");
  const hasData = !!pack && !packLoading && !packError;

  return (
    <aside className="w-[540px] flex-shrink-0 border-l border-slate-200 bg-white overflow-y-auto">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 truncate max-w-[320px]">{title}</h1>
          {event && (
            <div className="text-xs text-slate-500 mt-1">
              {event.category && <span className="font-medium">{event.category}</span>}
              {event.severity && (
                <>
                  {" • "}
                  <span
                    className={`font-medium ${
                      event.severity === "high"
                        ? "text-red-700"
                        : event.severity === "medium"
                        ? "text-amber-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {event.severity.toUpperCase()}
                  </span>
                </>
              )}
              {event.startTime && <> • Started {formatTs(event.startTime)}</>}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {hasData && (
            <button
              onClick={exportVisibleSignals}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Export Signals
            </button>
          )}
          <button
            onClick={() => setSelectedEventId(null)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
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
              {(["exposure", "decision", "reality", "satellite"] as TabKey[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 py-4 text-center text-sm font-medium transition-colors border-b-2 ${
                    activeTab === t
                      ? "border-blue-600 text-blue-700 font-semibold"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                  }`}
                >
                  {t === "exposure" ? "Exposure" :
                   t === "decision" ? "Decision Risk" :
                   t === "reality" ? "Reality" : "Satellite"}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="pt-6 space-y-10">
              {/* ... your existing exposure, decision, satellite tabs ... */}

              {activeTab === "reality" && (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {/* Header with live toggle */}
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        Signals Control Center
                        <span className="text-sm font-normal text-slate-500">(real-time feed)</span>
                      </h2>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={liveMode}
                            onChange={(e) => {
                              setLiveMode(e.target.checked);
                              if (e.target.checked) setScrubPct(100);
                            }}
                            className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                          <span className={liveMode ? "font-medium text-blue-700" : "text-slate-600"}>Live</span>
                        </label>

                        <button
                          onClick={() => {
                            const csv = [
                              ["Time", "Source", "Confidence", "Text", "Tags", "Source Ref"],
                              ...displaySignals.map(s => [
                                formatTs(s.time),
                                s.sourceType,
                                s.confidence,
                                `"${(s.text || "").replace(/"/g, '""')}"`,
                                (s.tags || []).join(", "),
                                s.sourceRef || "",
                              ])
                            ].map(row => row.join(",")).join("\n");

                            const blob = new Blob([csv], { type: "text/csv" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `chronozone-signals-${pack?.event?.id || "event"}.csv`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
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
                          {signals.filter(s => s.confidence === "high").length}
                        </div>
                        <div className="text-xs text-emerald-800">High</div>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <div className="text-xl font-bold text-amber-700">
                          {signals.filter(s => s.sourceType === "x").length}
                        </div>
                        <div className="text-xs text-amber-800">X</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="text-xl font-bold text-blue-700">
                          {signals.filter(s => s.sourceRef).length}
                        </div>
                        <div className="text-xs text-blue-800">Sourced</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                        <div className="text-xl font-bold text-purple-700">
                          {new Set(signals.flatMap(s => s.tags || [])).size}
                        </div>
                        <div className="text-xs text-purple-800">Tags</div>
                      </div>
                    </div>

                    {/* Scrubber */}
                    <div className="mb-6 p-5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-base font-semibold text-slate-900">Timeline Scrubber</div>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={useScrubber}
                            onChange={(e) => setUseScrubber(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          Use time filter
                        </label>
                      </div>

                      {useScrubber && (
                        <>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={scrubPct}
                            onChange={(e) => setScrubPct(Number(e.target.value))}
                            className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <div className="mt-3 text-sm text-slate-600 text-center">
                            Showing up to: {formatTs(new Date(currentTime).toISOString())}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Signals list */}
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                      {displaySignals.length > 0 ? (
                        displaySignals.map((s) => (
                          <div
                            key={s.id}
                            className={`p-5 rounded-xl border transition-all duration-300 ${
                              liveMode && s === displaySignals[0]
                                ? "border-blue-400 bg-blue-50/30 animate-pulse-slow shadow-md"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            } group`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <time className="font-semibold text-slate-900">
                                    {formatTs(s.time)}
                                  </time>
                                  {liveMode && s === displaySignals[0] && (
                                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 animate-pulse">
                                      Latest
                                    </span>
                                  )}
                                </div>

                                <p className={`text-slate-700 ${expandedSignal === s.id ? "" : "line-clamp-3"}`}>
                                  {s.text}
                                </p>

                                {s.tags?.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-1.5">
                                    {s.tags.map(tag => (
                                      <button
                                        key={tag}
                                        onClick={() => filterByTag(tag)}
                                        className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                                          filterTag === tag
                                            ? "bg-slate-800 text-white border-slate-800"
                                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                        }`}
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
                                    {s.sourceType.toUpperCase()}
                                  </span>
                                  <span
                                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                                      s.confidence === "high" ? "bg-emerald-100 text-emerald-800" :
                                      s.confidence === "medium" ? "bg-amber-100 text-amber-800" :
                                      "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    {s.confidence.toUpperCase()}
                                  </span>
                                </div>

                                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {s.sourceRef && (
                                    <a
                                      href={s.sourceRef}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                      Source →
                                    </a>
                                  )}

                                  <button
                                    onClick={() => setExpandedSignal(prev => prev === s.id ? null : s.id)}
                                    className="text-sm text-slate-500 hover:text-slate-700"
                                  >
                                    {expandedSignal === s.id ? "Collapse" : "Expand"}
                                  </button>

                                  <button
                                    onClick={() => navigator.clipboard.writeText(s.text)}
                                    className="text-sm text-slate-500 hover:text-slate-700"
                                  >
                                    Copy
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
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
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
