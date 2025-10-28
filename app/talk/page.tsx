"use client";

import React, { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function TalkToPdf() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [docId, setDocId] = useState<string | null>(null);
  const [docName, setDocName] = useState<string>("");
  const [cards, setCards] = useState<{ title: string; body: string }[]>([]);
  const [preview, setPreview] = useState<string>("");
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function ingest() {
    if (!selectedFile) return;
    setBusy(true);
    setError(null);
    setAnswer("");

    try {
      const form = new FormData();
      form.append("file", selectedFile);
      form.append("name", selectedFile.name);

      const res = await fetch("/api/talk/ingest", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Upload failed");

      setDocId(data.docId);
      setDocName(data.name);
      setCards(data.cards || []);
      setPreview(data.preview || "");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function ask() {
    if (!docId || !q.trim()) return;
    setBusy(true);
    setError(null);
    setAnswer("");

    try {
      const res = await fetch("/api/talk/query", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ docId, q }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Query failed");
      setAnswer(data.answer);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold mb-2">Talk to the PDF — MongoDB Vector Search Demo</h1>
      <p className="text-slate-600 mb-8">
        Upload a PDF, we create info cards and index it in MongoDB. Then ask questions against the indexed document.
      </p>

      {/* Upload card */}
      {!docId && (
        <Card className="border-dashed border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <Button disabled={!selectedFile || busy} onClick={ingest}>
                {busy ? "Processing…" : "Ingest PDF"}
              </Button>
            </div>
            {error && <p className="text-sm text-red-600 mt-3">Error: {error}</p>}
          </CardContent>
        </Card>
      )}

      {/* Info + Ask */}
      {docId && (
        <>
          <div className="mt-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-medium">Indexed: {docName}</h2>
              <p className="text-slate-500 text-sm">docId: {docId}</p>
            </div>
            <Button variant="outline" onClick={() => { setDocId(null); setCards([]); setPreview(""); setAnswer(""); }}>
              Upload another
            </Button>
          </div>

          {/* cards */}
          {cards.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {cards.map((c, i) => (
                <Card key={i} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{c.title}</h3>
                      <Badge variant="secondary">Card {i + 1}</Badge>
                    </div>
                    <p className="text-sm text-slate-700">{c.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* preview */}
          {preview && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Preview</p>
                <p className="text-sm whitespace-pre-line">{preview}</p>
              </CardContent>
            </Card>
          )}

          {/* ask box */}
          <div className="flex items-center gap-3 mt-6">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ask something like 'How does vector search improve compliance?'"
            />
            <Button onClick={ask} disabled={busy || !q.trim()}>
              {busy ? "Thinking…" : "Ask"}
            </Button>
          </div>

          {/* answer */}
          {answer && (
            <Card className="mt-4 border bg-white shadow-sm">
              <CardContent className="p-6">
                <pre className="whitespace-pre-wrap text-slate-800 text-sm">{answer}</pre>
              </CardContent>
            </Card>
          )}
          {error && <p className="text-sm text-red-600 mt-3">Error: {error}</p>}
        </>
      )}
    </main>
  );
}

