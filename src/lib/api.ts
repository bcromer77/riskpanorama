export type LatLng = { lat: number; lng: number };

export type SatelliteFrame = {
  label: "before" | "after";
  ts: string; // ISO
  url: string; // image url (can be stub or provider url)
  provider?: string; // "NASA GIBS" | "Sentinel-2" | etc
  cloudPct?: number;
};

export type SatelliteLayer = {
  center: LatLng;
  zoom?: number;
  frames: SatelliteFrame[]; // allow N frames (timeline), not just exactly two
};

export type ChronozoneEvent = {
  id: string;
  title: string;
  category: string;
  severity?: "low" | "medium" | "high";
  startTime?: string; // ISO
  location: LatLng;
  summary?: string;
  context?: {
    tags?: string[];
    regions?: string[];
    dependencies?: string[];
    satellite?: SatelliteLayer;
  };
};

export type ChronozoneSignal = {
  id: string;
  eventId: string;
  time: string; // ISO
  sourceType: "x" | "news" | "official" | "other" | "satellite" | "firms" | "ais";
  sourceRef?: string;
  confidence: "high" | "medium" | "low";
  text: string;
  tags?: string[];

  // Crucial: allows RightPanel to render evidence without ?.
  evidence?: {
    kind?: "satellite" | "photo" | "video" | "doc";
    capturedAt?: string;
    cloudPct?: number;
    previewUrl?: string;
  };
};

export type SecondOrderRisk = {
  id: string;
  eventId: string;
  timeHorizon: string;
  sector: string;
  risk: string;
  mechanism: string;
  commercialImpact: string;
};

export type ProcurementSignal = {
  id: string;
  eventId: string;
  type: "mispricing" | "withdrawal" | "absence";
  signal: string;
  implication: string;
};

export type ExposureAssessment = {
  assumptions: string[];
  observed: string[];
  assessment: string;
  implication: string;
  rangePct?: { low: number; high: number };
  confidence: "low" | "medium" | "high";
  confidenceRationale?: string;
};

export type EventPack = {
  event: ChronozoneEvent;
  signals: ChronozoneSignal[];
  secondOrderRisks: SecondOrderRisk[];
  procurementSignals: ProcurementSignal[];
  assessment?: ExposureAssessment;
};
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }

  return (await res.json()) as T;
}

export function getEvents(params?: {
  from?: string;
  to?: string;
  category?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  if (params?.category) qs.set("category", params.category);

  const q = qs.toString();
  return apiFetch<{ events: ChronozoneEvent[] }>(
    `/v1/chronozone/events${q ? `?${q}` : ""}`
  );
}

export function getEventPack(eventId: string) {
  return apiFetch<EventPack>(`/v1/chronozone/events/${eventId}/pack`);
}
