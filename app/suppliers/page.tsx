"use client";
import Link from "next/link";

export default function SuppliersPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Supplier Workspace</h1>
      <p className="text-sm text-slate-500">
        Manage your evidence, generate Battery Passports, and verify compliance.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/intelligence" className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition">
          <p className="font-medium text-slate-900 mb-1">Intelligence Workspace</p>
          <p className="text-xs text-slate-500">AI matching, evidence ingestion, veracity scores.</p>
        </Link>
        <Link href="/passport" className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition">
          <p className="font-medium text-slate-900 mb-1">Battery Passports</p>
          <p className="text-xs text-slate-500">Generate and share QR-linked passports.</p>
        </Link>
      </div>
    </main>
  );
}

