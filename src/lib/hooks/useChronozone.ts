"use client";

"use client";

import { useEffect, useState, useCallback } from "react";
import { getEvents, getEventPack } from "@/lib/api";
import type { ChronozoneEvent, EventPack } from "@/lib/api";

export function useEvents(opts?: { from?: string; to?: string; category?: string }) {
  const [events, setEvents] = useState<ChronozoneEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getEvents(opts)
      .then((r) => {
        if (!cancelled) setEvents(r.events || []);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "Failed to load events");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [opts?.from, opts?.to, opts?.category]);

  return { events, loading, error };
}

interface UseEventPackOptions {
  eventId?: string | null;
  pollIntervalMs?: number; // e.g. 45000 for 45-second live updates
}

export function useEventPack({ eventId, pollIntervalMs }: UseEventPackOptions = {}) {
  const [pack, setPack] = useState<EventPack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await getEventPack(eventId);
      setPack(r);
    } catch (e: any) {
      setError(e?.message || "Failed to load event pack");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Initial fetch
  useEffect(() => {
    if (!eventId) {
      setPack(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getEventPack(eventId)
      .then((r) => {
        if (!cancelled) setPack(r);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "Failed to load event pack");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [eventId, refetch]);

  // Optional live polling (only when pollIntervalMs > 0)
  useEffect(() => {
    if (!eventId || !pollIntervalMs || pollIntervalMs <= 0) return;

    const interval = setInterval(() => {
      refetch();
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [eventId, pollIntervalMs, refetch]);

  return { pack, loading, error, refetch };
}
