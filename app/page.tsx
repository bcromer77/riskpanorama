"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await fetch("/api/signup", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex flex-col items-center justify-center text-center px-6">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-5xl md:text-6xl font-light text-slate-800 leading-tight max-w-3xl"
      >
        Where <span className="text-indigo-600 font-medium">Risk</span> Starts Thinking for Itself
      </motion.h1>
      <p className="mt-4 text-slate-600 max-w-xl text-lg">
        AI agents, hybrid search, and cognitive reasoning — a new intelligence layer for markets.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 flex gap-3 w-full max-w-md">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-slate-700 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-lg font-medium"
        >
          {submitted ? "✓ Joined" : "Join Early Access"}
        </button>
      </form>
      <motion.img
        src="/dashboard-preview.png"
        alt="RiskPanorama preview"
        className="mt-16 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 1 }}
      />
      <p className="mt-8 text-xs text-slate-500">
        Built on MongoDB Atlas. Launching Q1 2026. By <span className="font-medium text-slate-600">Bazil Cromer</span>.
      </p>
    </main>
  );
}

