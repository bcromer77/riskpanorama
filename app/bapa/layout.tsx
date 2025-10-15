// app/bapa/layout.tsx
"use client";

import React from "react";
import Navbar from "@/components/shared/Navbar";
import EmergingSignals from "@/components/bapa/EmergingSignals";

export default function BapaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white text-gray-900">
      <Navbar />
      <main className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6 px-6 py-8">
        <div className="xl:col-span-2 space-y-6">{children}</div>
        <div className="xl:col-span-1">
          <EmergingSignals />
        </div>
      </main>
    </div>
  );
}

