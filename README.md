Chronozone — Dossier → AOI → Evidence Schema (Enterprise)

Chronozone is a Decision Risk Infrastructure layer that attaches observable reality (satellite + thermal + vessel/air + news signals) to enterprise decisions (procurement, operations, M&A, insurance, infrastructure).

Chronozone does not automate decisions.
Chronozone surfaces what requires verification, with evidence linked to time + geometry.

What this is

A structured evidence layer that enterprise teams can use to answer:

Why is a bid 10% cheaper? (mispricing vs genuine efficiency)

Why did an incumbent stop bidding? (withdrawal as a signal)

Where are we exposed right now? (assumptions vs observed reality)

What can we defend in an audit / dispute / regulator review? (evidence pack)

What this is not

❌ Procurement workflow / RFP tool

❌ Vendor ranking system

❌ Automated decision engine

❌ “AI that tells you what to do”

This is:

A calm, evidence-first layer that makes exposure visible before decisions are made.

Core Concepts
1) Dossier (the “decision file”)

A Dossier is the enterprise container for a decision context:

Examples:

“Tesco — Palm Oil Procurement Pilot Q2 2026”

“Angola LNG acquisition — operating risk monitoring”

“Supplier X — delivery continuity verification”

“Port of Rotterdam — disruption monitoring”

A dossier holds:

decision scope

stakeholders

policy constraints

AOIs (areas of interest)

evidence streams

exposures / signals / verification tasks

export packs

2) AOI (Area of Interest)

AOI is the geospatial + contextual anchor that evidence attaches to.

An AOI can be:

a refinery footprint polygon

a port boundary polygon

a shipping chokepoint corridor

a mine lease polygon

a supplier facility + surrounding radius buffer (e.g., 10 km)

a route corridor (pipeline, road, rail)

AOI is the critical abstraction because it allows:

stable monitoring over time

provider-agnostic evidence ingestion

enterprise governance (permissions, retention, audit)

3) Evidence (immutable, time-bound, source-bound)

Evidence is a record of what was observed or what was asserted (signal) at a time.

Evidence is never overwritten.
Evidence can be superseded by later evidence, but not replaced.

Evidence must be:

time-stamped (capturedAt and/or publishedAt)

geospatially anchored (geometry or AOI link)

source-typed (satellite, thermal, AIS, news, official, etc.)

retrievable (URL, blob pointer, or provider request recipe)

attributable (provider / dataset / license metadata)

Enterprise Operating Model
Typical enterprise workflow
Phase A — Setup (once)

Create Dossier

Define AOIs (polygons / buffers / corridors)

Assign Evidence Sources (Sentinel, FIRMS, AIS, etc.)

Set monitoring rules (frequency, alert thresholds, routing)

Set governance (RBAC, retention, export permissions)

Phase B — Monitoring (continuous)

Chronozone pulls signals and evidence on schedule

System creates “Observations” and “Signals” in evidence stream

System derives Exposures (mispricing, absence, withdrawal, misalignment)

Assign verification tasks (human review)

Produce defensible outputs (packs for procurement / investment committee / audit)

Phase C — Decision / audit (when needed)

Export a Dossier Pack: chronology + evidence + reasoning trail

Support decision memo / board deck / regulator inquiry

Preserve provenance and immutability

Data Schema (Reference)

Below is a practical schema that works in MongoDB (Atlas) or Postgres.

You can implement as collections/tables:

dossiers

aois

evidence_items

evidence_runs

exposures

verification_tasks

exports

1) Dossier schema
export type Dossier = {
  id: string;                     // dos_*
  orgId: string;                  // enterprise tenant
  title: string;
  description?: string;

  // Enterprise metadata
  dossierType: "procurement" | "infrastructure" | "mna" | "insurance" | "compliance" | "other";
  status: "active" | "closed" | "archived";
  createdAt: string;              // ISO
  updatedAt: string;              // ISO

  // Governance
  classification?: "public" | "internal" | "confidential" | "restricted";
  retentionPolicy?: {
    evidenceRetentionDays: number;     // e.g. 365, 2555
    exportRetentionDays: number;
  };

  // Permissions/RBAC (minimal model)
  access: {
    owners: string[];              // userIds
    editors: string[];
    viewers: string[];
  };

  // Optional: link to procurement / project identifiers
  externalRefs?: {
    procurementBidId?: string;
    projectId?: string;
    contractId?: string;
  };
};

Enterprise use:

Single dossier per major decision (or per supplier)

Dossier becomes the “audit file” that can be exported

2) AOI schema
export type AOI = {
  id: string;                    // aoi_*
  dossierId: string;             // link to dossier
  orgId: string;

  name: string;                  // "Ras Tanura Refinery"
  type: "site" | "corridor" | "region" | "port" | "mine" | "supplier_facility" | "other";

  // Geometry (GeoJSON)
  geometry: {
    type: "Polygon" | "MultiPolygon" | "LineString" | "Point";
    coordinates: any;
  };

  // Convenience fields
  centroid?: { lat: number; lng: number };
  bufferKm?: number;             // optional radius buffer for "site" AOI

  // Monitoring intent
  intent?: {
    whatToDetect?: string[];      // ["fire", "construction change", "port congestion"]
    businessExposure?: string[];  // ["diesel", "LNG", "fertilizer", "reefer freight"]
    criticalSuppliers?: string[];
  };

  // Provider configuration per AOI
  sources: {
    sentinel?: {
      enabled: boolean;
      dataset: "sentinel-2-l2a" | "sentinel-1-grd";
      maxCloudPct?: number;
      revisitDays?: number;       // e.g. 5
    };
    firms?: {
      enabled: boolean;
      region: "global" | "uscan";
      minConfidence?: "low" | "nominal" | "high";
    };
    ais?: {
      enabled: boolean;
      provider?: "marinetraffic" | "aisstream" | "other";
    };
    news?: {
      enabled: boolean;
      querySeeds?: string[];      // entity keywords for enrichment
    };
  };

  createdAt: string;
  updatedAt: string;
};

Enterprise use:

AOIs are reusable and can be attached to multiple dossiers if needed

AOI is where monitoring and evidence collection is governed

3) Evidence Item schema (the core)

Evidence Items are the atomic records.

export type EvidenceItem = {
  id: string;                      // ev_*
  orgId: string;
  dossierId: string;
  aoiId: string;

  // Source type
  kind:
    | "satellite_optical"
    | "satellite_radar"
    | "thermal_anomaly"
    | "ais_vessel"
    | "adsb_air"
    | "news"
    | "official"
    | "user_upload";

  // Time discipline
  capturedAt?: string;             // when sensor observed (satellite/thermal/AIS)
  publishedAt?: string;            // when narrative published (news/official)
  ingestedAt: string;              // when we stored it

  // Human meaning
  title?: string;                  // "Sentinel-2 scene"
  summary?: string;                // short factual note
  tags?: string[];                 // ["fire", "smoke", "shutdown", "rerouting"]
  confidence?: "low" | "medium" | "high";

  // Geospatial anchor (optional if AOI already anchors)
  geometry?: any;                  // GeoJSON for the actual observation footprint

  // Provenance (non-negotiable)
  provenance: {
    provider: string;              // "sentinelhub", "nasa_firms", "gdelt"
    dataset?: string;              // "sentinel-2-l2a", "VIIRS", "MODIS"
    license?: string;              // "Copernicus", "NASA Open Data", etc.
    request?: any;                 // the exact query/recipe used (for reproducibility)
    hash?: string;                 // content hash if file stored
  };

  // Storage pointers
  assets?: {
    previewUrl?: string;           // CDN signed URL or local path
    fullResUrl?: string;           // optional
    thumbnailUrl?: string;
    rawFileRef?: {
      bucket: string;
      key: string;
      etag?: string;
    };
  };

  // Linkage to exposures / tasks
  linkedExposureIds?: string[];
  linkedTaskIds?: string[];

  // Optional: link to event objects (your existing Chronozone events)
  eventId?: string;                // evt_*
};

Enterprise use:

Every evidence item is defensible because it contains provenance + time + AOI linkage

Items can be exported into evidence packs with citations and retrieval recipes

4) Evidence Runs (automation record)

Evidence runs record how evidence was collected.

export type EvidenceRun = {
  id: string;                      // run_*
  orgId: string;
  dossierId: string;
  aoiId: string;
  provider: "sentinel" | "firms" | "ais" | "news";

  startedAt: string;
  finishedAt: string;
  status: "ok" | "partial" | "failed";

  input: any;                       // bbox, polygon, time window, filters
  output: {
    evidenceItemIds: string[];
    count: number;
  };

  errors?: { message: string; raw?: any }[];
};

Enterprise use:

Audit trail: “what did the system do, when, and with what parameters”

5) Exposures (the decision-risk output)

Exposures are derived interpretations — not evidence.

export type Exposure = {
  id: string;                      // exp_*
  orgId: string;
  dossierId: string;
  aoiId?: string;
  eventId?: string;

  type: "mispricing" | "withdrawal" | "absence" | "misalignment" | "contradiction";
  severity: "low" | "medium" | "high";

  headline: string;                // "Forward pricing lags physical disruption"
  rationale: string;               // careful neutral explanation
  whatToVerify: string[];          // checklist

  createdAt: string;
  status: "open" | "triaged" | "closed";

  // Evidence linkage (required)
  evidenceRefs: {
    evidenceItemId: string;
    note?: string;
  }[];

  // Optional enterprise routing
  assignedTo?: string;             // userId
  dueBy?: string;
};

Enterprise use:

Exposure is what procurement / IC sees first.

Exposure always points to evidence items for defensibility.

6) Verification Tasks (human-in-the-loop)
export type VerificationTask = {
  id: string;                     // task_*
  orgId: string;
  dossierId: string;
  exposureId?: string;
  aoiId?: string;

  title: string;                  // "Confirm diesel unit status at Ras Tanura"
  instructions: string;           // steps
  status: "open" | "in_progress" | "done" | "blocked";

  createdAt: string;
  updatedAt: string;

  evidenceItemIds?: string[];
};

Enterprise use:

Tasks convert “signal” into “actionable verification”

Clear separation between observation and decision

How enterprise clients use this (examples)
A) Procurement — “Why is a bid 10% cheaper?”

Dossier: “Category: Frozen logistics — RFP Q2 2026”
AOIs: supplier depots, shipping chokepoints, key refineries, ports
Evidence streams: Sentinel-2, FIRMS, AIS, news signals

What Chronozone surfaces:

Exposure: Mispricing — freight and fuel are repricing but bids lag

Evidence: AIS congestion + thermal anomalies + satellite confirmation

Task: verify surcharge clauses + hedging + substitution plans

Deliverable:

“Decision Risk Pack” attached to procurement memo:

Evidence linked to time + map

Questions to suppliers

What assumptions are unsafe

B) Infrastructure / M&A — asset monitoring

Dossier: “Angola LNG — acquisition monitoring”
AOIs: facility footprint, nearby villages, port, flare stacks
Evidence: Sentinel-1 radar (cloud/night), thermal anomalies, news

Chronozone outputs:

Timeline of operational stability signals

Thermal anomalies (flare events)

Construction changes (radar/optical)

Export pack for investment committee

C) Insurance / Claims — verification

Dossier: “Loss event verification — refinery incident”
AOI: affected site polygon
Evidence: FIRMS + Sentinel + official statements

Outputs:

Confirm timing window of heat signature

Confirm smoke plume / damage signature (if visible)

Attach provenance for audit

UI mapping (what goes where)

Your right panel tabs map directly to schema:

Exposure tab

Exposure[] (with evidence references)

SecondOrderRisk[] (optional derived)

Decision risk tab

Procurement lens views built from Exposure.type and whatToVerify

Observed reality tab

Chronological feed of EvidenceItem (news + official + AIS + thermal)

Satellite imagery tab

EvidenceItem.kind = satellite_*

slider by capturedAt

compare scenes within AOI bounds

Integration with Zach’s “Dossier” structure
Minimal integration contract

Zach’s backend should expose:

POST /dossiers

POST /dossiers/:id/aois

GET /dossiers/:id/evidence?kind=&from=&to=

POST /dossiers/:id/runs/:provider (trigger provider run)

GET /dossiers/:id/exposures

POST /dossiers/:id/exposures (human-created, optional)

Chronozone frontend can point at Zach’s base URL and remain unchanged.

Provider module contract (critical)

Every provider returns EvidenceItem[] + optional Exposure[].

Sentinel provider

Input: AOI polygon + date range + dataset (S2/S1)
Output: EvidenceItems with:

capturedAt

previewUrl

provenance.request = Process API payload (evalscript, bbox, etc.)

FIRMS provider

Input: AOI polygon + from/to + confidence filter
Output: EvidenceItems:

kind = thermal_anomaly

geometry = point(s)

provenance = FIRMS dataset + API request

Secrets and environment variables

Do not use NEXT_PUBLIC for secrets.

Use server-side .env.local:

SENTINEL_CLIENT_ID=...

SENTINEL_CLIENT_SECRET=...

FIRMS_MAP_KEY=...

CHRONOZONE_API_BASE=... (optional)

Non-negotiables for enterprise defensibility

Provenance required (provider, dataset, license, request recipe)

Immutability (no silent overwrites)

Time discipline:

capturedAt != event truth

publishedAt != capturedAt

Evidence is separate from interpretation

EvidenceItem ≠ Exposure

Exports must preserve linkage

every claim points to evidence IDs and retrieval recipe

Next build steps (recommended)

Implement AOI creation endpoint + storage

Implement Sentinel “scene listing” and store scenes as EvidenceItem

Implement FIRMS AOI query → EvidenceItem(kind=thermal_anomaly)

Add Evidence slider that reads from /dossiers/:id/evidence?kind=satellite_optical

Add Export Pack builder: dossier → AOIs → evidence → exposures → tasks

Guiding principle

Observe reality first.
Read narrative second.
Decide last.

Chronozone exists to surface:

“Where could we be wrong — and what would we need to verify before committing?”
