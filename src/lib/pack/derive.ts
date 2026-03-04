import type {
  ChronozoneSignal,
  EventClaim,
  PackBrief,
  ForceMajeureDeclaration,
} from "@/lib/api";

const hasTag = (s: ChronozoneSignal, tag: string) => s.tags?.includes(tag);

export function deriveForceMajeure(eventId: string, signals: ChronozoneSignal[]): ForceMajeureDeclaration[] {
  const fmSignals = signals.filter((s) => hasTag(s, "force-majeure"));
  if (!fmSignals.length) return [];

  // Pick best signal: prefer official + high confidence + latest time
  const best = [...fmSignals]
    .sort((a, b) => {
      const sa = (a.sourceType === "official" ? 3 : a.sourceType === "news" ? 2 : 1);
      const sb = (b.sourceType === "official" ? 3 : b.sourceType === "news" ? 2 : 1);
      if (sb !== sa) return sb - sa;
      if (b.confidence !== a.confidence) return (b.confidence === "high" ? 2 : b.confidence === "medium" ? 1 : 0) -
        (a.confidence === "high" ? 2 : a.confidence === "medium" ? 1 : 0);
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    })[0];

  return [
    {
      id: `fm_${eventId}_001`,
      eventId,
      status: hasTag(best, "confirmed") ? "confirmed" : "reported",
      declaredAt: best.time,
      disruptionStart: undefined,
      expectedRestart: undefined,
      scope: { commodity: "LNG", affectedFacilities: ["Ras Laffan (scope under assessment)"] },
      artifacts: best.sourceRef
        ? [{ type: "notice_web", url: best.sourceRef, title: "Force Majeure notice", issuedAt: best.time, source: best.sourceType }]
        : [],
      confidence: best.confidence,
      extractedFromSignalIds: [best.id || ""].filter(Boolean),
      lastUpdated: new Date().toISOString(),
    },
  ];
}

export function deriveClaims(eventId: string, signals: ChronozoneSignal[]): EventClaim[] {
  const fm = signals.find((s) => hasTag(s, "force-majeure") && hasTag(s, "official"));
  if (!fm) return [];

  return [
    {
      id: `clm_${eventId}_fm`,
      eventId,
      time: fm.time,
      statement: "Force Majeure declared on select obligations.",
      status: "supported",
      confidence: fm.confidence,
      support: { signalIds: [fm.id || ""].filter(Boolean), artifactUrls: fm.sourceRef ? [fm.sourceRef] : [] },
    },
  ];
}

export function deriveBrief(eventId: string, signals: ChronozoneSignal[]): PackBrief | undefined {
  const hasFM = signals.some((s) => hasTag(s, "force-majeure"));
  if (!hasFM) return undefined;

  return {
    headline: "Force Majeure declared: operational disruption becomes contract reality.",
    whatChanged: ["Signals escalated from disruption chatter into formal non-performance posture (FM)."],
    whyItMatters: ["FM shifts the situation from logistics to legal obligations and pricing structure."],
    openQuestions: ["Scope, duration, and restart milestones remain unclear."],
    confidence: "medium",
    lastUpdated: new Date().toISOString(),
  };
}
