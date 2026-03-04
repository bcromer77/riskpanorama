"use client";

import { useMemo, useState } from "react";
import { useEvents, useEventPack } from "@/lib/hooks/useChronozone";
import dynamic from "next/dynamic";

// IMPORTANT: Leaflet/map components should be loaded client-only
const WorldMonitorMap = dynamic(
  () => import("@/components/worldmonitor/WorldMonitorMap"),
  { ssr: false }
);

import RightPanel from "@/components/monitor/RightPanel";

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function MonitorPage() {
  const now = useMemo(() => new Date(), []);
  const from = useMemo(() => isoDay(new Date(now.getTime() - 3 * 86400000)), [now]);
  const to = useMemo(() => isoDay(now), [now]);

  const { events, loading: eventsLoading, error: eventsError } = useEvents({ from, to });

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Polling-enabled event pack: 45 seconds when event is selected
  const { pack, loading: packLoading, error: packError, refetch } =
    useEventPack({
      eventId: selectedEventId,
      pollIntervalMs: selectedEventId ? 45000 : 0, // 45s when event selected
    });

  // Optional: satellite date state (passed to map & panel)
  const [satDate, setSatDate] = useState<string>(() => isoDay(new Date()));

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-slate-50/70">
      {/* Left: Map / Events */}
      <div className="flex-1 relative overflow-hidden">
        <WorldMonitorMap
          events={events}
          loading={eventsLoading}
          selectedEventId={selectedEventId}
          onSelectEvent={setSelectedEventId}
          satDate={satDate}
        />

        {/* Status pill */}
        <div className="absolute left-5 top-5 z-20">
          <div
            className={`px-4 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm transition-colors ${
              eventsLoading
                ? "bg-white/80 text-slate-600"
                : eventsError
                ? "bg-red-50/90 text-red-700 border border-red-200"
                : "bg-white/90 text-slate-700 border border-slate-200"
            }`}
          >
            {eventsLoading
              ? "Loading events…"
              : eventsError
              ? "Error loading events"
              : `${events.length} ${events.length === 1 ? "event" : "events"}`}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <RightPanel
        selectedEventId={selectedEventId}
        setSelectedEventId={setSelectedEventId}
        pack={pack}
        packLoading={packLoading}
        packError={packError}
        satDate={satDate}
        setSatDate={setSatDate}
        // Optional: pass refetch if RightPanel wants manual refresh buttons
        // refetch={refetch}
      />
    </div>
  );
}
