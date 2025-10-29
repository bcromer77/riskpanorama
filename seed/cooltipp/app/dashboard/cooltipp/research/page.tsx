k"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CoolTippResearchUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const upload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("researcher", "Galina Kennedy");

    const res = await fetch("/api/research/upload", { method: "POST", body: formData });
    const data = await res.json();
    setSummary(data.summary);
    setLoading(false);
  };

  return (
    <div className="p-6">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Upload Research (CoolTipp)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <Button onClick={upload} disabled={loading}>
            {loading ? "Analysing..." : "Upload & Analyse"}
          </Button>
          {summary && (
            <div className="mt-4 bg-green-50 border border-green-200 p-3 rounded-lg text-sm">
              <b>Alignment Summary</b>
              <p>{summary}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

