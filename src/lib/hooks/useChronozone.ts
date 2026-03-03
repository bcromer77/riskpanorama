"use client";

import { useEffect, useState } from "react";
import type { ChronozoneEvent, EventPack } from "../api";
import { getEvents, getEventPack } from "../api";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.from, opts?.to, opts?.category]);

  return { events, loading, error };
}

export function useEventPack(eventId?: string | null) {
  const [pack, setPack] = useState<EventPack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }, [eventId]);

  return { pack, loading, error };
}
