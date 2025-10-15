"use client";
import React, { useState } from "react";

export default function AskBAPA() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse("");
    try {
      const res = await fetch("/api/bapa/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });
      const data = await res.json();
      setResponse(data.answer || "No clear insights found.");
    } catch (e) {
      console.error("Error asking BAPA:", e);
      setResponse("⚠️ Error fetching insights.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white shadow-md rounded-lg border border-slate-200">
      <h1 className="text-3xl font-light text-slate-800 mb-4">💬 Ask BAPA</h1>
      <p className="text-slate-600 mb-6 text-sm">
        Type a regulatory, ESG, or supply-chain question — BAPA will summarize relevant signals and insights from the database.
      </p>
      <div className="flex gap-3 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. What risks affect lithium exports from Chile?"
          className="flex-1 border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={handleAsk}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
        >
          {loading ? "Thinking..." : "Ask"}
        </button>
      </div>
      {response && (
        <div className="mt-6 p-4 border border-slate-300 rounded-md bg-slate-50 text-slate-700">
          {response}
        </div>
      )}
    </div>
  );
}

