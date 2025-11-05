"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Mail, Zap, FileText, Link2 } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the D3 graph (client-side only)
const NetworkGraph = dynamic(() => import("@/components/NetworkGraph"), {
  ssr: false,
});

export default function ResearcherProfilePage() {
  const { slug } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/researcher/${slug}`);
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    }
    fetchProfile();
  }, [slug]);

  if (!profile)
    return <div className="p-10 text-slate-500">Loading profile…</div>;

  async function handleSendMessage() {
    const res = await fetch("/api/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: slug, text: message }),
    });
    if (res.ok) setSent(true);
  }

  return (
    <main className="p-8 bg-gradient-to-br from-slate-50 to-white min-h-screen space-y-8">
      {/* HEADER */}
      <section className="flex flex-col md:flex-row gap-6 items-start">
        <img
          src={profile.photo}
          alt={profile.name}
          className="w-32 h-32 rounded-full object-cover border border-slate-200 shadow-sm"
        />
        <div>
          <h1 className="text-2xl font-semibold">{profile.name}</h1>
          <p className="text-sm text-slate-500">{profile.title}</p>
          <p className="mt-2 text-slate-700 max-w-xl">{profile.bio}</p>
          <a
            href={profile.externalUrl}
            target="_blank"
            className="text-xs text-indigo-600 mt-2 inline-flex items-center gap-1"
          >
            <Link2 className="h-3 w-3" /> NexSys profile
          </a>
        </div>
      </section>

      {/* RESEARCH SUMMARY */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-indigo-600" /> Uploaded Research
        </h2>
        {profile.research?.map((doc: any, i: number) => (
          <div
            key={i}
            className="text-sm text-slate-700 border-b border-slate-100 py-2"
          >
            <strong>{doc.title}</strong> — {doc.summary.slice(0, 140)}…
          </div>
        ))}
      </section>

      {/* NETWORK VISUALIZATION */}
      {profile.network && profile.network.nodes?.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-600" /> Impact Network
          </h2>
          <NetworkGraph
            key={slug as string}
            nodes={profile.network.nodes}
            links={profile.network.links}
          />
        </section>
      )}

      {/* DM / CONTACT SECTION */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <Mail className="h-4 w-4 text-pink-600" /> Message{" "}
          {profile.name.split(" ")[0]}
        </h2>
        {sent ? (
          <p className="text-sm text-emerald-600">
            ✅ Message sent successfully!
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message…"
              className="border border-slate-300 rounded-lg p-3 text-sm"
            />
            <button
              onClick={handleSendMessage}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-md w-fit"
            >
              Send Message
            </button>
          </div>
              )}
      </section>
    </main>
  );
}


