// app/layout.tsx
"use client";

import "./globals.css";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { metadata } from "./metadata"; // ✅ SEO lives here — DO NOT redeclare

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Determine initial mode based on current path
  const initialMode = pathname.startsWith("/city") ? "city" : "supplier";
  const [mode, setMode] = useState<"city" | "supplier">(initialMode);

  // Toggle and navigate between modes
  function handleToggle() {
    const nextMode = mode === "city" ? "supplier" : "city";
    setMode(nextMode);
    router.push(`/${nextMode}`);
  }

  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {/* ─── Global Navbar ─────────────────────────────── */}
        <header className="border-b bg-white/80 backdrop-blur-md shadow-sm px-6 py-3 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Left: Branding */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 grid place-items-center text-white font-bold">
                B
              </div>
              <h1 className="font-semibold text-emerald-700 tracking-tight text-lg">
                RareEarthMinerals.ai — Global Supply-Chain Compliance & Horizon Scanning
              </h1>
            </div>

            {/* Right: Navigation + Toggle */}
            <nav className="flex items-center gap-6 text-sm text-slate-700 font-medium">
              <a href="/" className="hover:text-emerald-700 transition-colors">
                Home
              </a>
              <a href="/sku" className="hover:text-emerald-700 transition-colors">
                SKU
              </a>
<a href="/veracity" className="hover:text-emerald-700 transition-colors">
  Veracity
</a>

              <a href="/ask" className="hover:text-emerald-700 transition-colors">
                Ask
              </a>
              <a href="/signals" className="hover:text-emerald-700 transition-colors">
                Signals
              </a>
              <a href="/dashboard" className="hover:text-emerald-700 transition-colors">
                Dashboard
              </a>
              <a href="/city" className="hover:text-emerald-700 transition-colors">
                Cities
              </a>
              <a href="/supplier" className="hover:text-emerald-700 transition-colors">
                Suppliers
              </a>

              {/* Live ESG Mode Toggle */}
              <motion.button
                onClick={handleToggle}
                className="relative inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-slate-200 hover:bg-emerald-100 transition-all overflow-hidden w-[100px]"
                whileTap={{ scale: 0.95 }}
              >
                <motion.span
                  layout
                  className={`absolute top-0 left-0 h-full w-1/2 rounded-full bg-emerald-500 transition-transform ${
                    mode === "city" ? "translate-x-full" : "translate-x-0"
                  }`}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
                <div className="flex justify-between w-full z-10 text-[12px]">
                  <span
                    className={`w-1/2 text-center transition-colors ${
                      mode === "supplier" ? "text-white" : "text-slate-600"
                    }`}
                  >
                    Supplier
                  </span>
                  <span
                    className={`w-1/2 text-center transition-colors ${
                      mode === "city" ? "text-white" : "text-slate-600"
                    }`}
                  >
                    City
                  </span>
                </div>
              </motion.button>
            </nav>
          </div>
        </header>

        {/* ─── Page Content ─────────────────────────────── */}
        <div className="p-6">
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
