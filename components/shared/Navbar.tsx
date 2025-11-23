// components/shared/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/instrument", label: "Upload & Query" },
    { href: "/", label: "Intelligence" },
    { href: "/supply-chain", label: "Supply Chain" },
    { href: "/vault", label: "Vault" },
    { href: "/search", label: "Search" },
  ];

  const isActiveLink = (href: string) => {
    if (href === "/") {
      // Intelligence is the home & main intelligence surface
      return pathname === "/" || pathname.startsWith("/intelligence");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="w-full border-b border-slate-200 bg-white sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="text-emerald-700 font-semibold text-sm tracking-tight hover:text-emerald-800 transition-colors"
        >
          RareEarthMinerals.ai — Global Supply-Chain & Horizon Scanning
        </Link>

        <nav className="flex items-center gap-6 text-sm text-slate-600">
          {navLinks.map(({ href, label }) => {
            const active = isActiveLink(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative transition-all duration-200 hover:text-emerald-700 ${
                  active
                    ? "text-emerald-700 font-medium after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-emerald-700"
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
