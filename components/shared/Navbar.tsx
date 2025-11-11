// components/shared/Navbar.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/intelligence", label: "Intelligence" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/retailers", label: "Retailers" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-md transition-all duration-300 ${
        scrolled
          ? "bg-white/80 shadow-md border-b border-slate-200"
          : "bg-white/60 border-b border-slate-100 shadow-sm"
      }`}
    >
      <div className="px-6 py-3 flex items-center justify-between max-w-7xl mx-auto">
        <h1 className="font-semibold text-green-700 tracking-tight">
          RareEarthMinerals.ai — Global Supply-Chain & Horizon Scanning
        </h1>

        <nav className="flex gap-6 text-sm text-slate-700">
          {NAV_ITEMS.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative transition-colors duration-200 hover:text-green-700 ${
                  isActive
                    ? "text-green-700 font-semibold after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-green-700"
                    : ""
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

