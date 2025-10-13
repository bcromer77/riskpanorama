"use client";
import { useState } from "react";

export default function CascadePage() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function runCascade() {
    if (!query) return;
    setLoading(true);
    const res = await fetch("/api/oracle/cascade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-gray-800 p-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold mb-4 text-center">
          🔮 Oracle Cascade Dashboard
        </h1>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter query (e.g., China graphite export controls)"
            className="flex-1 border rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-indigo-400"
          />
          <button
            onClick={runCascade}
            disabled={loading}
            className="bg-indigo-600 text-white px-5 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Thinking..." : "Run"}
          </button>
        </div>

        {data?.ok && (
          <div className="space-y-8">
            {data.cascades.map((group: any) => (
              <section
                key={group.theme}
                className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-sm"
              >
                <h2 className="text-2xl font-semibold mb-3">{group.theme}</h2>
                <p className="text-sm text-gray-500 mb-4 italic">
                  {group.query}
                </p>
                <div className="grid gap-3">
                  {group.results.map((r: any, i: number) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-white/60 border border-gray-100 shadow-sm hover:shadow-md transition"
                    >
                      <div className="font-medium text-gray-800">{r.title}</div>
                      <div className="text-sm text-gray-500">
                        {r.region} • {r.sector} • {r.risk_type}
                      </div>
                      <div className="h-2 mt-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500"
                          style={{ width: `${Math.min(r.score * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {data && !data.ok && (
          <div className="text-red-600 mt-4">
            ❌ {data.error || "Something went wrong"}
          </div>
        )}
      </div>
    </main>
  );
}

