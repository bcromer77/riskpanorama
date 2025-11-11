"use client";

import { useState } from "react";

export default function AskPage() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAsk() {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("/api/bapa/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ Ensure backend receives the correct key
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      if (data.success && (data.summary || data.tldr)) {
        const text = data.summary || data.tldr || "No summary available.";
        const risks = data.risks || [];
        setResponse(
          `<p class="mb-4 text-gray-800">${text}</p>` +
            (risks.length
              ? `<ul class="space-y-2">${risks
                  .map(
                    (r: any) =>
                      `<li class="border border-gray-200 rounded-md p-3">
                         <strong>${r.title}</strong><br />
                         <small>${r.body}</small>
                       </li>`
                  )
                  .join("")}</ul>`
              : "")
        );
      } else {
        setResponse("No clear insights found.");
      }
    } catch (err) {
      console.error(err);
      setResponse("⚠️ Error fetching insights.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto mt-16 p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-semibold mb-2 flex items-center gap-2">
        💬 Ask BAPA
      </h1>
      <p className="text-gray-600 mb-4">
        Type a regulatory, ESG, or supply-chain question — BAPA will summarise
        relevant signals and insights from the database.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. What risks affect lithium exports from Chile?"
          className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          className={`px-6 py-2 rounded-md text-white font-semibold transition-colors ${
            loading
              ? "bg-emerald-300 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {loading ? "Thinking..." : "Ask"}
        </button>
      </div>

      {response && (
        <div
          className="mt-6 bg-gray-50 border border-gray-200 rounded-md p-4 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: response }}
        />
      )}
    </div>
  );
}

