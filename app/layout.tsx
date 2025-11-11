import Link from "next/link";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#FAFAF6] text-slate-800">
        {/* Top Navigation Bar */}
        <header className="w-full border-b bg-white sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link href="/" className="text-emerald-700 font-semibold text-sm tracking-tight">
              RareEarthMinerals.ai — Global Supply-Chain & Horizon Scanning
            </Link>

            {/* Navigation Links */}
            <nav className="flex items-center gap-6 text-sm text-slate-600">
              <Link href="/" className="hover:text-emerald-600 transition">Home</Link>
              <Link href="/sku" className="hover:text-emerald-600 transition">SKU</Link>
              <Link href="/intelligence" className="hover:text-emerald-600 transition font-semibold">
                Intelligence
              </Link>
              <Link href="/dashboard" className="hover:text-emerald-600 transition">Dashboard</Link>
              <Link href="/suppliers" className="hover:text-emerald-600 transition">Suppliers</Link>
            </nav>
          </div>
        </header>

        {/* Page Content */}
        <main>{children}</main>
      </body>
    </html>
  );
}

