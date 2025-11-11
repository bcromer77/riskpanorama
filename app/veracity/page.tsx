// app/veracity/page.tsx
"use client";

import { useState, useEffect } from "react";

type RegSection = {
  id: string;
  title: string;
  match: number;
  snippet: string;
};

type Evidence = {
  articleId: string;
  file: string;
  score: number;
  note: string;
};

const REG_SECTIONS: RegSection[] = [
  {
    id: "art7",
    title: "Article 7 — Carbon Footprint Declaration",
    match: 88,
    snippet:
      "Requires disclosure of carbon intensity at cell or battery level.",
  },
  {
    id: "art8",
    title: "Article 8 — Due Diligence & Responsible Sourcing",
    match: 71,
    snippet:
      "Requires traceability and human-rights due diligence for critical minerals.",
  },
  {
    id: "art10",
    title: "Article 10 — Reporting, Labelling, Digital Passport",
    match: 63,
    snippet:
      "Requires battery passport data to be made digitally available.",
  },
];

export default function VeracityPage() {
  const [active, setActive] = useState<RegSection>(REG_SECTIONS[0]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [querying, setQuerying] = useState(false);
  const [customQuery, setCustomQuery] = useState("");
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // 🔍 Fetch matching evidence dynamically from your /api/bapa/query endpoint
  useEffect(() => {
    const fetchEvidence = async () => {
      setQuerying(true);
      const res = await fetch("/api/bapa/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: active.title }),
      });
      const data = await res.json();
      if (data?.results) {
        const mapped = data.results.map((r: any, i: number) => ({
          articleId: active.id,
          file: r.metadata?.source || `Document ${i + 1}`,
          score: r.score || 0.75,
          note: r.text?.slice(0, 120) + "...",
        }));
        setEvidence(mapped);
      } else {
        setEvidence([]);
      }
      setQuerying(false);
    };
    fetchEvidence();
  }, [active]);

  // 🧠 Optional: run custom AI question
  async function handleAsk() {
    if (!customQuery.trim()) return;
    const res = await fetch("/api/bapa/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: customQuery }),
    });
    const data = await res.json();
    setAiInsight(
      data?.results?.[0]?.text?.slice(0, 300) ||
        "No relevant insights found in current database."
    );
  }

  async function sendToSlack() {
    await fetch("/api/share-to-slack", {
      method: "POST",
      body: JSON.stringify({
        title: `Battery Passport readiness for ${active.title}`,
        summary: `Coverage ${active.match}%. ${evidence.length} matching supplier documents.`,
      }),
    });
    alert("Sent summary to Slack ✅");
  }

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Veracity Workspace
          </h1>
          <p className="text-sm text-slate-500">
            EU Battery Regulation → matched to your supplier evidence.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={sendToSlack}
            className="bg-slate-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-800"
          >
            Send summary to Slack
          </button>
          <button className="border text-sm px-4 py-2 rounded-lg hover:bg-slate-50">
            Upload evidence
          </button>
        </div>
      </div>

      {/* Custom Query Bar */}
      <div className="flex gap-2">
        <input
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          placeholder="Ask a regulatory, ESG, or evidence question..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <button
          onClick={handleAsk}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700"
        >
          Ask Regulation
        </button>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-12 gap-4">
        {/* LEFT */}
        <div className="col-span-3 bg-white border rounded-xl p-3 space-y-2">
          <p className="text-xs font-medium text-slate-500 mb-2">
            Regulation articles
          </p>
          {REG_SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActive(section)}
              className={`w-full text-left rounded-lg p-2 transition ${
                active.id === section.id
                  ? "bg-slate-900 text-white"
                  : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-medium">{section.title}</span>
                <span
                  className={`text-[10px] px-2 py-[2px] rounded-full ${
                    section.match > 80
                      ? "bg-emerald-100 text-emerald-700"
                      : section.match > 60
                      ? "bg-amber-100 text-amber-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {section.match}%
                </span>
              </div>
              <p className="text-xs opacity-80">{section.snippet}</p>
            </button>
          ))}
        </div>

        {/* CENTER */}
        <div className="col-span-6 bg-white border rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {active.title}
              </h2>
              <p className="text-xs text-slate-500">{active.snippet}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase text-slate-400">Coverage</p>
              <p className="text-lg font-semibold">{active.match}%</p>
            </div>
          </div>

          {querying ? (
            <div className="text-xs text-slate-400">Fetching evidence...</div>
          ) : evidence.length === 0 ? (
            <div className="text-xs text-slate-400">
              No evidence yet for this regulation.
            </div>
          ) : (
            evidence.map((e, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between border rounded-lg p-3 bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {e.file}
                  </p>
                  <p className="text-xs text-slate-500">{e.note}</p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xs font-semibold ${
                      e.score > 0.8
                        ? "text-emerald-600"
                        : e.score > 0.6
                        ? "text-amber-500"
                        : "text-rose-500"
                    }`}
                  >
                    {(e.score * 100).toFixed(0)}%
                  </p>
                  <p className="text-[10px] text-slate-400">match</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* RIGHT */}
        <div className="col-span-3 space-y-3">
          <div className="bg-white border rounded-xl p-3 space-y-2">
            <p className="text-xs font-medium text-slate-500 mb-1">AI insight</p>
            <p className="text-sm text-slate-800">
              {aiInsight
                ? aiInsight
                : `3 of 5 obligations currently covered for ${active.title}. Missing supplier proof for digital passport (Article 10).`}
            </p>
          </div>

          <div className="bg-white border rounded-xl p-3 space-y-2">
            <p className="text-xs font-medium text-slate-500 mb-1">
              Quick actions
            </p>
            <button className="w-full text-left text-sm bg-slate-900 text-white rounded-lg px-3 py-2">
              Ask: “What counts as valid evidence?”
            </button>
            <button className="w-full text-left text-sm border rounded-lg px-3 py-2">
              Generate supplier request pack
            </button>
            <button
              onClick={sendToSlack}
              className="w-full text-left text-sm border rounded-lg px-3 py-2"
            >
              Push update to Slack
            </button>
          </div>

          <div className="bg-white border rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Last vector sync:</p>
            <p className="text-xs text-slate-700">
              Mozambique, Canada, Mexico, EU Guidance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

