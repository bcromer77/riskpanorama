"use client";

import { useMemo, useState, useEffect } from "react";
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
  const [dayOffset, setDayOffset] = useState(0); // 0 = today, 7300 ≈ 20 years

  // Sync slider → satDate
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() - dayOffset);
    setSatDate(d.toISOString().slice(0, 10));
  }, [dayOffset, setSatDate]);

  // Auto-snap to event start time if available
  useEffect(() => {
    if (pack?.event?.startTime) {
      const eventDate = new Date(pack.event.startTime);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - eventDate.getTime()) / (86400000));
      if (diffDays >= 0 && diffDays <= 7300) {
        setDayOffset(diffDays);
      }
    }
  }, [pack?.event?.startTime]);

  // ── Chronology scrubber (Reality tab) ──
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

  const visibleSignals = useMemo(
    () => signals.filter((s) => new Date(s.time).getTime() <= currentTime),
    [signals, currentTime]
  );

  // ── Export handlers ──
  const handleExportCSV = () => {
    if (!pack) return;
    const csvRows = [
      ["Time", "Source", "Confidence", "Text", "Source Ref"],
      ...visibleSignals.map((s) => [
        formatTs(s.time),
        s.sourceType,
        s.confidence,
        `"${s.text.replace(/"/g, '""')}"`,
        s.sourceRef || "",
      ]),
    ];

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chronozone_signals_${pack.event?.id || "event"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── UI derived values ──
  const event = pack?.event;
  const title = event?.title || (packLoading ? "Loading event…" : "Select an event");
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
                    event.severity === "high" ? "bg-red-100 text-red-700" :
                    event.severity === "medium" ? "bg-amber-100 text-amber-700" :
                    "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {event.severity.toUpperCase()}
                </span>
              )}
              {event.startTime && (
                <span>Started: {formatTs(event.startTime)}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {hasData && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              title="Export timeline & signals as CSV"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m0-2v-2m0-2V7m-4 10h8m-4-10h4m-4 0V5m0 2v2m0 2v2m0 2v2m0 2v2" />
              </svg>
              Export CSV
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
              Click any marker or event in the list to view second-order exposure, decision risks, observed reality, and satellite context.
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
              {activeTab === "exposure" && (
                <div className="space-y-8">
                  <div className="p-6 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/70 to-white shadow-sm">
                    <div className="flex items-start justify-between gap-6 mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-amber-900">Exposure Assessment</h2>
                        <p className="text-amber-800 mt-1.5">Where pre-priced reality creates deferred risk</p>
                      </div>
                      {pack.assessment?.confidence && (
                        <span
                          className={`inline-flex px-5 py-2 text-sm font-semibold rounded-full border shadow-sm ${
                            pack.assessment.confidence === "high" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                            pack.assessment.confidence === "medium" ? "bg-amber-100 text-amber-800 border-amber-200" :
                            "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          Confidence: {pack.assessment.confidence.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <p className="text-slate-800 text-lg leading-relaxed font-medium">
                      {pack.assessment?.implication ||
                        "Current market pricing lags emerging physical & behavioral signals — contracts signed now likely embed unpriced second-order exposure."}
                    </p>

                    <div className="mt-8 grid gap-6 md:grid-cols-2">
                      <div className="p-5 bg-white rounded-xl border border-slate-200">
                        <h3 className="text-base font-semibold text-slate-900 mb-3">Current Assumptions</h3>
                        <ul className="space-y-2.5 text-slate-700">
                          {pack.assessment?.assumptions?.map((a, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-slate-400 mt-1">•</span>
                              <span>{a}</span>
                            </li>
                          )) || (
                            <>
                              <li className="flex items-start gap-2"><span className="text-slate-400 mt-1">•</span> Supply & logistics continuity fully priced</li>
                              <li className="flex items-start gap-2"><span className="text-slate-400 mt-1">•</span> No major escalation or pass-through expected</li>
                            </>
                          )}
                        </ul>
                      </div>

                      <div className="p-5 bg-white rounded-xl border border-slate-200">
                        <h3 className="text-base font-semibold text-slate-900 mb-3">Observed Signals</h3>
                        <ul className="space-y-2.5 text-slate-700">
                          {pack.assessment?.observed?.map((o, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-slate-400 mt-1">•</span>
                              <span>{o}</span>
                            </li>
                          )) || (
                            <>
                              <li className="flex items-start gap-2"><span className="text-slate-400 mt-1">•</span> Physical disruption ahead of repricing</li>
                              <li className="flex items-start gap-2"><span className="text-slate-400 mt-1">•</span> Operator / supplier communication lag</li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>

                    {pack.assessment?.rangePct && (
                      <div className="mt-8 p-6 bg-amber-50/50 rounded-xl border border-amber-200">
                        <div className="text-lg font-bold text-amber-900 mb-2">
                          Estimated Mispricing Range: {pack.assessment.rangePct.low}–{pack.assessment.rangePct.high}%
                        </div>
                        <p className="text-amber-800">
                          Contracts / positions initiated now likely carry deferred exposure — second-order effects not yet reflected in pricing.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Procurement Signals */}
                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900">Procurement Signals</h3>
                    {pack.procurementSignals?.length ? (
                      <div className="space-y-5">
                        {pack.procurementSignals.map((p) => (
                          <div
                            key={p.id}
                            className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-6">
                              <div className="flex-1">
                                <div className="font-semibold text-slate-900 text-lg">{p.signal}</div>
                                <p className="mt-3 text-slate-700 leading-relaxed">{p.implication}</p>
                              </div>
                              <span className="inline-flex px-4 py-2 text-sm font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                {p.type.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 bg-slate-50 rounded-2xl text-center text-slate-500 border border-slate-200">
                        No procurement signals detected yet.
                      </div>
                    )}
                  </section>
                </div>
              )}

              {activeTab === "decision" && (
                <div className="space-y-8">
                  <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Decision Risk Lens</h2>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Why this bid looks unusually cheap</h3>
                        <ul className="space-y-3 text-slate-700">
                          <li className="flex items-start gap-3">
                            <span className="text-amber-500 text-xl mt-0.5">⚠</span>
                            <span>Pre-event pricing assumptions still embedded</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-amber-500 text-xl mt-0.5">⚠</span>
                            <span>Fuel / freight / insurance surcharges deferred</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-amber-500 text-xl mt-0.5">⚠</span>
                            <span>Single corridor or feedstock dependency not priced</span>
                          </li>
                        </ul>
                      </div>

                      <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Why known suppliers are silent</h3>
                        <ul className="space-y-3 text-slate-700">
                          <li className="flex items-start gap-3">
                            <span className="text-amber-500 text-xl mt-0.5">⚠</span>
                            <span>Already see upstream cost pressure or delivery risk</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-amber-500 text-xl mt-0.5">⚠</span>
                            <span>Avoiding mispriced exposure in forward commitments</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-amber-500 text-xl mt-0.5">⚠</span>
                            <span>Internal capacity / hedging constraints</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-8 p-6 bg-white rounded-xl border border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Absence Signals (our unique wedge)</h3>
                      <p className="text-slate-700 mb-4">
                        What is **not** being said or bid often reveals more than what is.
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold text-blue-600">
                          {pack.procurementSignals?.filter(p => p.type === "absence").length || 0}
                        </div>
                        <div className="text-slate-600">
                          absence indicators detected — silence from incumbents is a leading risk signal.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "reality" && (
                <div className="space-y-8">
                  <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Observed Reality Timeline</h2>

                    {/* Convergence score stub — future vector search hook */}
                    <div className="mb-6 p-5 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-blue-900">Signal Convergence Score</div>
                          <div className="text-xs text-blue-700 mt-1">
                            (Future: vector search across X, news, AIS, filings — higher = stronger pre-priced reality shift)
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-blue-700">—</div>
                      </div>
                    </div>

                    {/* Scrubber */}
                    <div className="p-5 bg-slate-50 rounded-lg border border-slate-200 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-base font-semibold text-slate-900">Time Scrubber</div>
                        <div className="text-sm text-slate-600">
                          Showing signals up to: {formatTs(new Date(currentTime).toISOString())}
                        </div>
                      </div>

                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={scrubPct}
                        onChange={(e) => setScrubPct(Number(e.target.value))}
                        className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />

                      <div className="mt-4 flex justify-between text-xs text-slate-500">
                        <span>{signals[0] ? formatTs(signals[0].time) : "—"}</span>
                        <span>{signals[signals.length - 1] ? formatTs(signals[signals.length - 1].time) : "—"}</span>
                      </div>
                    </div>

                    {/* Signals */}
                    {visibleSignals.length > 0 ? (
                      <div className="space-y-5">
                        {visibleSignals.map((s) => (
                          <div
                            key={s.id}
                            className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-sm"
                          >
                            <div className="flex items-center justify-between gap-6 mb-4">
                              <time className="font-semibold text-slate-900 text-lg">{formatTs(s.time)}</time>
                              <div className="flex items-center gap-3">
                                <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                                  {s.sourceType.toUpperCase()}
                                </span>
                                <span
                                  className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                                    s.confidence === "high" ? "bg-emerald-100 text-emerald-800" :
                                    s.confidence === "medium" ? "bg-amber-100 text-amber-800" :
                                    "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {s.confidence.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            <p className="text-slate-700 leading-relaxed">{s.text}</p>

                            {s.sourceRef && (
                              <a
                                href={s.sourceRef}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                              >
                                View original source →
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
                        No signals in selected time window.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "satellite" && (
                <div className="space-y-8">
                  <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Satellite & Imagery Context</h2>

                    <div className="grid gap-6 md:grid-cols-2 mb-8">
                      <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Current View Center</h3>
                        <div className="font-mono text-slate-700 text-lg">
                          {pack?.event?.location?.lat?.toFixed(4) ?? "—"},{" "}
                          {pack?.event?.location?.lng?.toFixed(4) ?? "—"}
                        </div>
                      </div>

                      <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Selected Date</h3>
                        <div className="font-mono text-slate-700 text-lg">{satDate}</div>
                      </div>
                    </div>

                    {/* 20-Year Slider */}
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-base font-semibold text-slate-900">
                          Historical Satellite Date
                        </label>
                        <span className="text-sm font-mono bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                          {satDate}
                        </span>
                      </div>

                      <input
                        type="range"
                        min={0}
                        max={7300} // ~20 years
                        step={1}
                        value={dayOffset}
                        onChange={(e) => {
                          const offset = Number(e.target.value);
                          setDayOffset(offset);
                          const d = new Date();
                          d.setDate(d.getDate() - offset);
                          setSatDate(d.toISOString().slice(0, 10));
                        }}
                        className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
                      />

                      <div className="mt-4 flex justify-between text-sm text-slate-600">
                        <span>Today</span>
                        <span>20 years ago (~2006)</span>
                      </div>

                      {/* Exact date picker */}
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Or jump to exact date:
                        </label>
                        <input
                          type="date"
                          value={satDate}
                          max={new Date().toISOString().slice(0, 10)}
                          min="2000-01-01"
                          onChange={(e) => {
                            const newDate = e.target.value;
                            setSatDate(newDate);
                            const selected = new Date(newDate);
                            const today = new Date();
                            const diffDays = Math.floor((today.getTime() - selected.getTime()) / 86400000);
                            if (diffDays >= 0 && diffDays <= 7300) {
                              setDayOffset(diffDays);
                            }
                          }}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Imagery Preview */}
                    <div className="mt-8 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video relative flex items-center justify-center">
                      <div className="text-center px-8">
                        <div className="text-6xl mb-6 opacity-70">🛰️</div>
                        <div className="text-xl font-semibold text-slate-700">
                          Sentinel-2 / Landsat Overlay for {satDate}
                        </div>
                        <div className="text-sm text-slate-600 mt-3">
                          Uses current map bounding box — imagery loads dynamically
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 text-sm text-slate-500 italic text-center">
                      Pre-priced reality detection: Compare visual changes against contract pricing assumptions.
                      Older dates may use Landsat (pre-2015). Cloud cover and resolution vary.
                    </div>
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
