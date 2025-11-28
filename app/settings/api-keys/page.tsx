// app/settings/api-keys/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ApiKeysPage() {
  const [name, setName] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const createKey = async () => {
    setLoading(true);
    const res = await fetch("/api/org/admin/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        permissions: ["ingest", "agent"],
      }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">API Keys</h1>

      <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-8 space-y-6">
        <Input
          placeholder="Key name (e.g. Production Ingest)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Button onClick={createKey} disabled={loading || !name}>
          {loading ? "Creating..." : "Generate API Key"}
        </Button>

        {result?.success && (
          <div className="mt-8 p-6 bg-rose-900/30 border border-rose-600 rounded-xl">
            <p className="text-rose-300 font-bold mb-4">
              COPY THIS KEY NOW — IT WILL NEVER BE SHOWN AGAIN
            </p>
            <code className="block bg-black/50 p-4 rounded font-mono text-green-400 break-all">
              {result.fullKey}
            </code>
            <div className="mt-4 space-y-2 text-sm">
              <p>Prefix (shown in UI): <Badge>{result.keyPrefix}</Badge></p>
              <p>Permissions: {result.permissions.join(", ")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
