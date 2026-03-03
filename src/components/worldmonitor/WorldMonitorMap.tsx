"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Assuming you still have these types somewhere
type LatLng = { lat: number; lng: number };
type EventMarker = {
  id: string;
  title: string;
  location: LatLng;
  category?: string;
  severity?: "low" | "medium" | "high";
};

interface WorldMonitorMapProps {
  events: EventMarker[];
  loading?: boolean;
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
  satDate: string; // YYYY-MM-DD
}

export default function WorldMonitorMap({
  events,
  loading,
  selectedEventId,
  onSelectEvent,
  satDate,
}: WorldMonitorMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const imageryLayerRef = useRef<L.ImageOverlay | null>(null);
  const [imageryError, setImageryError] = useState<string | null>(null);
  const [isImageryLoading, setIsImageryLoading] = useState(false);

  // Initialize Leaflet map (only once)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([25.0, 55.0], 5); // Gulf-centered default

    // Base map
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Optional: zoom control in top-right
    L.control.zoom({ position: "topright" }).addTo(mapRef.current);

    // Cleanup
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Function to load imagery for current view & date
  const loadImagery = useCallback(async () => {
    if (!mapRef.current) return;

    setIsImageryLoading(true);
    setImageryError(null);

    // Remove previous layer if exists
    if (imageryLayerRef.current) {
      mapRef.current.removeLayer(imageryLayerRef.current);
      imageryLayerRef.current = null;
    }

    // Get current map bounds (dynamic!)
    const bounds = mapRef.current.getBounds();
    const bbox = [
      bounds.getWest(),    // minLng
      bounds.getSouth(),   // minLat
      bounds.getEast(),    // maxLng
      bounds.getNorth(),   // maxLat
    ];

    // Build server route URL
    const url = `/v1/chronozone/sentinel/process?` +
      `bbox=${bbox.join(",")}&` +
      `date=${encodeURIComponent(satDate)}&` +
      `w=1024&h=1024`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);

      // Create overlay using current bounds
      imageryLayerRef.current = L.imageOverlay(objUrl, [
        [bounds.getSouth(), bounds.getWest()],
        [bounds.getNorth(), bounds.getEast()],
      ], {
        opacity: 0,
        attribution: "© Sentinel Hub / Copernicus",
      }).addTo(mapRef.current);

      // Fade in
      imageryLayerRef.current.setOpacity(0.85);

      // Store URL for cleanup
      (imageryLayerRef.current as any)._chronozoneObjUrl = objUrl;
    } catch (err: any) {
      console.error("Imagery fetch failed:", err);
      setImageryError("Failed to load satellite imagery");
    } finally {
      setIsImageryLoading(false);
    }
  }, [satDate]);

  // Load imagery when satDate changes or map is ready
  useEffect(() => {
    if (!mapRef.current) return;
    loadImagery();
  }, [satDate, loadImagery]);

  // Auto-refresh on map move/zoom (debounced)
  useEffect(() => {
    if (!mapRef.current) return;

    let timeout: NodeJS.Timeout;
    const debouncedReload = () => {
      clearTimeout(timeout);
      timeout = setTimeout(loadImagery, 800);
    };

    mapRef.current.on("moveend zoomend", debouncedReload);

    return () => {
      mapRef.current?.off("moveend zoomend", debouncedReload);
      clearTimeout(timeout);
    };
  }, [loadImagery]);

  // Cleanup object URLs when layer changes or component unmounts
  useEffect(() => {
    return () => {
      if (imageryLayerRef.current) {
        const url = (imageryLayerRef.current as any)._chronozoneObjUrl;
        if (url) URL.revokeObjectURL(url);
      }
    };
  }, []);

  return (
    <div className="h-full w-full flex flex-col p-4 bg-gray-50">
      {/* Header / status */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          {loading ? (
            <span className="text-gray-600 animate-pulse">Loading events…</span>
          ) : (
            `Loaded ${events.length} events`
          )}
        </div>
        {isImageryLoading && (
          <span className="text-xs text-blue-600 animate-pulse">Loading satellite imagery…</span>
        )}
        {imageryError && (
          <span className="text-xs text-red-600">{imageryError}</span>
        )}
      </div>

      {/* Map container */}
      <div ref={mapContainerRef} className="flex-1 rounded-xl shadow-inner overflow-hidden" />

      {/* Your existing event list (stub) */}
      <div className="mt-4 max-h-48 overflow-y-auto pr-2 space-y-2">
        {events.length === 0 ? (
          <div className="text-center text-gray-500 py-6">No events in view</div>
        ) : (
          events.map((e) => (
            <button
              key={e.id}
              onClick={() => onSelectEvent(e.id)}
              className={`w-full text-left p-3 border rounded-lg transition-all ${
                selectedEventId === e.id
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-300"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="font-medium">{e.title}</div>
              <div className="text-xs text-gray-600 mt-1">
                {e.location.lat.toFixed(3)}, {e.location.lng.toFixed(3)}
                {e.category && ` • ${e.category}`}
                {e.severity && ` • ${e.severity}`}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
