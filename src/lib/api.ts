// src/lib/api.ts

export type Confidence = "high" | "medium" | "low";
export type SourceType = "x" | "news" | "official" | "satellite" | "other";

// -----------------------------
// Force Majeure (structured)
// -----------------------------
export type ForceMajeureStatus =
  | "rumour"
  | "reported"
  | "confirmed"
  | "lifted"
  | "disputed";

export type ForceMajeureScope = {
  commodity?:
    | "LNG"
    | "condensate"
    | "crude"
    | "shipping"
    | "port"
    | "power"
    | "other";
  affectedContracts?: string[];
  affectedBuyers?: string[];
  affectedFacilities?: string[];
  estimatedVolumeImpactMtpa?: number;
};

export type ForceMajeureArtifact = {
  type:
    | "notice_web"
    | "notice_pdf"
    | "exchange_filing"
    | "buyer_circular"
    | "insurer_note"
    | "press_release"
    | "other";
  url: string;
  title?: string;
  issuedAt?: string; // ISO
  source?: string; // e.g. "QatarEnergy"
};

export type ForceMajeureDeclaration = {
  id: string;
  eventId: string;
  status: ForceMajeureStatus;
  declaredAt: string; // ISO (notice issued time)
  disruptionStart?: string; // ISO (earliest impact)
  expectedRestart?: string; // ISO (if known)
  scope: ForceMajeureScope;
  artifacts: ForceMajeureArtifact[];
  confidence: Confidence;
  extractedFromSignalIds: string[];
  lastUpdated: string; // ISO
};

// -----------------------------
// Pack Brief + Claims (auditable spine)
// -----------------------------
export type PackBrief = {
  headline: string;
  whatChanged: string[];
  whyItMatters: string[];
  openQuestions: string[];
  confidence: Confidence;
  lastUpdated: string; // ISO
};

export type ClaimStatus = "asserted" | "supported" | "disputed" | "uncertain";

export type ClaimSupport = {
  signalIds: string[];
  artifactUrls?: string[];
};

export type EventClaim = {
  id: string;
  eventId: string;
  time: string; // ISO (when claim became true/visible)
  statement: string;
  status: ClaimStatus;
  confidence: Confidence;
  support: ClaimSupport;
  notes?: string;
};

// -----------------------------
// Optional pack metadata
// -----------------------------
export type PackMeta = {
  packVersion?: string; // e.g. "demo-2026-03-04"
  generatedAt?: string; // ISO
  schemaVersion?: number; // bump when you change structure
};

// -----------------------------
// Domain models
// -----------------------------
export type ChronozoneEvent = {
  id: string;
  title: string;
  category?: string;
  severity?: "low" | "medium" | "high";
  location?: { lat: number; lng: number };
  startTime?: string;

  // ✅ you are using this in PACKS
  summary?: string;
};

export type ChronozoneSignal = {
  id?: string;

  // ✅ you are using this in PACKS
  eventId?: string;

  time: string; // ISO
  sourceType: SourceType;
  confidence: Confidence;

  text?: string;
  tags?: string[];
  sourceRef?: string;

  evidence?: {
    kind?: string;
    capturedAt?: string;
    cloudPct?: number;
    previewUrl?: string;
  };
};

// -----------------------------
// Optional typed sections (replace `any`)
// -----------------------------
export type SecondOrderRisk = {
  id: string;
  eventId: string;
  timeHorizon: string; // e.g. "0-60 days"
  sector: string;
  risk: string;
  mechanism: string;
  commercialImpact: string;
};

export type ProcurementSignal = {
  id: string;
  eventId: string;
  type: "mispricing" | "absence" | "withdrawal";
  signal: string;
  implication: string;
};

export type ExposureAssessment = {
  assumptions: string[];
  observed: string[];
  assessment: string;
  implication: string;
  rangePct?: { low: number; high: number };
  confidence: Confidence;
  confidenceRationale?: string;
};

// -----------------------------
// EventPack (single source of truth)
// -----------------------------
export type EventPack = {
  event: ChronozoneEvent;
  signals: ChronozoneSignal[];

  // keep optional for backward-compat + demo
  secondOrderRisks?: SecondOrderRisk[];
  procurementSignals?: ProcurementSignal[];
  assessment?: ExposureAssessment;

  // ✅ upgrades
  meta?: PackMeta;
  brief?: PackBrief;
  claims?: EventClaim[];
  forceMajeureDeclarations?: ForceMajeureDeclaration[];
};

// -----------------------------
// API helpers
// -----------------------------
const API_BASE = ""; // keep relative for Next

export async function getEvents(opts?: {
  from?: string;
  to?: string;
  category?: string;
}) {
  const qs = new URLSearchParams();
  if (opts?.from) qs.set("from", opts.from);
  if (opts?.to) qs.set("to", opts.to);
  if (opts?.category) qs.set("category", opts.category);

  const res = await fetch(
    `${API_BASE}/v1/chronozone/events?${qs.toString()}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`getEvents failed: ${res.status}`);
  return (await res.json()) as { events: ChronozoneEvent[] };
}

export async function getEventPack(eventId: string) {
  const res = await fetch(
    `${API_BASE}/v1/chronozone/events/${eventId}/pack`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`getEventPack failed: ${res.status}`);
  return (await res.json()) as EventPack;
}
