// app/layout.tsx (top portion)
import "./globals.css";
import Link from "next/link";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#FAFAF6] text-slate-900">
        <header className="border-b bg-white sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
            <Link href="/" className="font-semibold text-green-800 text-sm">
              RareEarthMinerals.ai — Global Supply-Chain & Horizon Scanning
            </Link>

            {/* 🔍 Global Search replaces “Ask” */}
            <input
              type="text"
              placeholder="Ask about suppliers, ESG, or regulations..."
              className="hidden md:block w-96 border rounded-lg px-3 py-1 text-sm focus:ring-1 focus:ring-emerald-500"
            />

            <nav className="flex gap-6 text-sm text-slate-700">
              <Link href="/sku">SKU</Link>
              <Link href="/veracity">Intelligence</Link>
              <Link href="/dashboard">Dashboard</Link>
            </nav>
          </div>
        </header>

        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}

