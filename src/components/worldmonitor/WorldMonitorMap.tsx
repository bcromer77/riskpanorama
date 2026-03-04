"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon paths (very common issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface EventMarker {
  id: string;
  title: string;
  location?: { lat: number; lng: number };
  severity?: "low" | "medium" | "high";
  category?: string;
}

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
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const imageryLayerRef = useRef<L.ImageOverlay | null>(null);

  const [imageryError, setImageryError] = useState<string | null>(null);
  const [isLoadingImagery, setIsLoadingImagery] = useState(false);

  // ───────────────────────────────
  // Hard-coded flashpoints (Tel Aviv, Riyadh, Beirut, Tehran, Damascus, Baghdad)
  // ───────────────────────────────
  const flashpoints: EventMarker[] = [
    { id: "tel-aviv", title: "Tel Aviv", location: { lat: 32.0853, lng: 34.7818 }, severity: "high", category: "security" },
    { id: "riyadh", title: "Riyadh", location: { lat: 24.7136, lng: 46.6753 }, severity: "medium", category: "diplomatic" },
    { id: "beirut", title: "Beirut", location: { lat: 33.8938, lng: 35.5018 }, severity: "high", category: "conflict" },
    { id: "tehran", title: "Tehran", location: { lat: 35.6892, lng: 51.3890 }, severity: "high", category: "nuclear" },
    { id: "damascus", title: "Damascus", location: { lat: 33.5138, lng: 36.2765 }, severity: "medium", category: "security" },
    { id: "baghdad", title: "Baghdad", location: { lat: 33.3152, lng: 44.3661 }, severity: "medium", category: "stability" },
  ];

  // Combine user events + flashpoints
  const allMarkers = useMemo(() => [...events, ...flashpoints], [events]);

  // ───────────────────────────────
  // Init map once
  // ───────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([25, 55], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      if (imageryLayerRef.current) {
        map.removeLayer(imageryLayerRef.current);
        imageryLayerRef.current = null;
      }
    };
  }, []);

  // ───────────────────────────────
  // Render markers (events + flashpoints)
  // ───────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const valid = allMarkers.filter((e) => e.location?.lat != null && e.location?.lng != null);

    for (const e of valid) {
      const { lat, lng } = e.location!;

      const isSelected = e.id === selectedEventId;

      let color = "#3b82f6"; // default blue
      let fillColor = "#60a5fa";
      if (e.severity === "high") {
        color = "#ef4444"; // red
        fillColor = "#f87171";
      } else if (e.severity === "medium") {
        color = "#f59e0b"; // amber
        fillColor = "#fbbf24";
      } else if (e.severity === "low") {
        color = "#10b981"; // emerald
        fillColor = "#34d399";
      }

      const marker = L.circleMarker([lat, lng], {
        radius: isSelected ? 12 : 8,
        weight: isSelected ? 4 : 2,
        opacity: 1,
        fillOpacity: 0.8,
        color,
        fillColor,
      });

      marker.bindTooltip(
        `<b>${e.title}</b><br>${e.category || ""} • ${e.severity?.toUpperCase() || "UNKNOWN"}`,
        { direction: "top", permanent: false, sticky: true, className: "custom-tooltip" }
      );

      marker.on("click", () => {
        onSelectEvent(e.id);
        map.setView([lat, lng], Math.max(map.getZoom(), 9), { animate: true });
      });

      // Pulse animation for high severity or selected
      if (isSelected || e.severity === "high") {
        marker.getElement()?.classList.add("animate-pulse-ring");
      }

      marker.addTo(markersLayer);
    }

    // Auto-fit if no selection yet
    if (!selectedEventId && valid.length > 0) {
      const bounds = L.latLngBounds(valid.map((e) => [e.location!.lat, e.location!.lng]));
      map.fitBounds(bounds.pad(0.3));
    }
  }, [allMarkers, selectedEventId, onSelectEvent]);

  // ───────────────────────────────
  // Load Sentinel imagery (when selection or date changes)
  // ───────────────────────────────
  const loadImagery = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;

    setImageryError(null);
    setIsLoadingImagery(true);

    if (!selectedEventId) {
      if (imageryLayerRef.current) {
        map.removeLayer(imageryLayerRef.current);
        imageryLayerRef.current = null;
      }
      setIsLoadingImagery(false);
      return;
    }

    const selected = allMarkers.find((e) => e.id === selectedEventId);
    if (!selected?.location) {
      console.warn("No location for selected event:", selectedEventId);
      setImageryError("No location data for selected event");
      setIsLoadingImagery(false);
      return;
    }

    const { lat, lng } = selected.location;

    // Bbox size (degrees) — small enough for Sentinel API limits / reasonable res
    const deg = 0.08; // ~9km span
    const bbox = [lng - deg, lat - deg, lng + deg, lat + deg] as const;

    console.log("Loading imagery for:", { eventId: selectedEventId, lat, lng, bbox, satDate });

    // Remove old layer
    if (imageryLayerRef.current) {
      map.removeLayer(imageryLayerRef.current);
      imageryLayerRef.current = null;
    }

    try {
      // Your proxy route — adjust query params to match your backend
      const url = `/v1/chronozone/sentinel/process?bbox=${bbox.join(",")}&date=${encodeURIComponent(satDate)}&w=1024&h=1024`;

      console.log("Fetching from:", url);

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Sentinel proxy failed: HTTP ${res.status} - ${errText}`);
      }

      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);

      const bounds: L.LatLngBoundsExpression = [
        [bbox[1], bbox[0]], // SW
        [bbox[3], bbox[2]], // NE
      ];

      imageryLayerRef.current = L.imageOverlay(objUrl, bounds, {
        opacity: 0.85,
        attribution: "© Sentinel Hub / Copernicus",
      }).addTo(map);

      // Fit to imagery bounds (smooth zoom)
      map.fitBounds(bounds, { animate: true, padding: [50, 50] });

      console.log("Satellite imagery loaded successfully");
    } catch (err: any) {
      console.error("Satellite load error:", err);
      setImageryError(err?.message || "Failed to load satellite imagery");
    } finally {
      setIsLoadingImagery(false);
    }
  }, [selectedEventId, satDate, allMarkers]);

  useEffect(() => {
    loadImagery();
  }, [loadImagery]);
<style jsx global>{`
  .animate-pulse-ring {
    animation: pulse-ring 2s infinite ease-in-out;
  }

  @keyframes pulse-ring {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.3);
      opacity: 0.6;
    }
  }

  .leaflet-tooltip.custom-tooltip {
    background: rgba(0, 0, 0, 0.85);
    color: white;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 13px;
    border: none;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    pointer-events: none;
  }
`}</style>
  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />

      {loading && (
        <div className="absolute top-4 left-4 bg-white/90 border border-slate-200 px-3 py-2 rounded shadow-sm text-sm">
          Loading events…
        </div>
      )}

      {isLoadingImagery && (
        <div className="absolute top-4 right-4 bg-white/90 border border-slate-200 px-3 py-2 rounded shadow-sm text-sm">
          Loading satellite imagery…
        </div>
      )}

      {imageryError && (
        <div className="absolute bottom-4 left-4 max-w-[420px] bg-red-50 text-red-800 border border-red-200 px-4 py-2 rounded shadow text-sm">
          {imageryError}
        </div>
      )}
    </div>
  );
}
