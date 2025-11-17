import "./globals.css";
import Navbar from "@/components/shared/Navbar";

export const metadata = {
  title: "RareEarthMinerals.ai — Global Supply-Chain & Horizon Scanning",
  description:
    "Integrated regulatory, supplier, and signal insights powered by MongoDB Atlas Vector Search.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#FAFAF6] text-slate-800 min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500 bg-white/70">
          <p>
            © {new Date().getFullYear()} RareEarthMinerals.ai — Built with{" "}
            <span className="text-emerald-600 font-medium">
              MongoDB Atlas Vector Search
            </span>
          </p>
        </footer>
      </body>
    </html>
  );
}

