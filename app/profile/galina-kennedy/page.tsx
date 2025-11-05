"use client";

import { useEffect, useState } from "react";
import { FileText, Zap, Upload, RefreshCw, Search } from "lucide-react";

export default function GalinaProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<Record<string, any>>({});
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 1️⃣ Load profile + any summaries from Mongo
  async function loadData() {
    const profileRes = await fetch("/api/researcher/galina-kennedy");
    const docsRes = await fetch("/api/docs?researcher=galina-kennedy");
    const profData = await profileRes.json();
    const docsData = await docsRes.json();
    setProfile(profData);
    setUploadedDocs(docsData.docs || []);
    for (const doc of docsData.docs || []) {
      const sumRes = await fetch(
        `/api/summaries?researcher=galina-kennedy&title=${encodeURIComponent(
          doc.title
        )}`
      );
      if (sumRes.ok) {
        const data = await sumRes.json();
        setSummaries((prev) => ({ ...prev, [doc.title]: data.summaries }));
      }
    }
  }

  // 2️⃣ Handle Upload
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", e.target.files[0]);
      formData.append("researcher", "galina-kennedy");
      const res = await fetch("/api/ingest", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      alert("✅ PDF uploaded and embedded successfully!");
      await loadData();
    } catch (err: any) {
      alert(`❌ Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  // 3️⃣ Query Galina’s vector embeddings
  async function handleQuery() {
    setLoading(true);
    setAnswer("");
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });
      const data = await res.json();
      if (data.answer) setAnswer(data.answer);
      else setAnswer("No relevant data found.");
    } catch {
      setAnswer("Error querying database.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (!profile) return <div className="p-10">Loading profile…</div>;

  return (
    <main className="p-8 bg-gradient-to-b from-slate-50 to-white min-h-screen space-y-8">
      {/* HEADER */}
      <section className="flex flex-col md:flex-row gap-6 items-start">
        <img
          src={profile.photo || "/galina.jpg"}
          alt={profile.name}
          className="w-32 h-32 rounded-full border border-slate-200 shadow-sm"
        />
        <div>
          <h1 className="text-2xl font-semibold">{profile.name}</h1>
          <p className="text-sm text-slate-500">{profile.title}</p>
          <p className="mt-2 text-slate-700 max-w-xl">{profile.bio}</p>
        </div>
      </section>

      {/* UPLOAD & RESEARCH */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-600" /> Uploaded Research
          </h2>
          <label className="cursor-pointer text-xs text-indigo-600 flex items-center gap-1">
            <Upload className="h-3 w-3" />
            {uploading ? "Uploading…" : "Upload PDF"}
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {uploadedDocs.length === 0 ? (
          <p className="text-sm text-slate-500 italic">
            No uploads yet — once Galina uploads a paper, summaries for each
            audience will appear here.
          </p>
        ) : (
          uploadedDocs.map((doc) => (
            <div
              key={doc.title}
              className="border border-slate-200 rounded-xl p-4 mb-4"
            >
              <h3 className="font-semibold text-slate-800 mb-2">
                {doc.title}
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                {summaries[doc.title]
                  ? Object.entries(summaries[doc.title]).map(([aud, text]) => (
                      <div
                        key={aud}
                        className="bg-slate-50 border border-slate-100 rounded-lg p-3"
                      >
                        <h4 className="font-medium text-sm mb-1 text-slate-700">
                          {aud} Summary
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {text}
                        </p>
                      </div>
                    ))
                  : "Generating summaries..."}
              </div>
            </div>
          ))
        )}
      </section>

      {/* SEARCH SECTION */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Search className="h-4 w-4 text-blue-600" /> Query Galina’s Research
        </h2>
        <p className="text-sm text-slate-500">
          Ask natural-language questions across all of Galina’s uploaded PDFs —
          powered by vector search and Voyage embeddings.
        </p>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. How can microgrids support NIS2 compliance?"
            className="flex-1 border border-slate-300 rounded-md p-2 text-sm"
          />
          <button
            onClick={handleQuery}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
        {answer && (
          <div className="mt-3 bg-slate-50 border border-slate-100 rounded-md p-3 text-sm text-slate-700">
            <strong>AI Summary:</strong> {answer}
          </div>
        )}
      </section>

      {/* COLLABORATORS */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-emerald-600" /> Impact & Collaborators
        </h2>
        <p className="text-sm text-slate-600">
          Connected with SEAI, ESB Networks, and Tipperary County Council to
          develop distributed energy resilience pilots aligned with EU NIS2
          directives.
        </p>
      </section>
    </main>
  );
}

