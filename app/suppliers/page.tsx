"use client";

export default function SuppliersPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-emerald-700 mb-4">
        Supplier Workspace
      </h1>
      <p className="text-slate-600 mb-6">
        Manage your evidence, generate Battery Passports, and verify compliance.
      </p>

      <div className="grid sm:grid-cols-2 gap-6">
        <a
          href="/instrument"
          className="p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition"
        >
          <h2 className="font-semibold text-slate-800 mb-2">
            Intelligence Workspace
          </h2>
          <p className="text-sm text-slate-500">
            AI matching, evidence ingestion, veracity scores.
          </p>
        </a>
        <a
          href="/passport"
          className="p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition"
        >
          <h2 className="font-semibold text-slate-800 mb-2">
            Battery Passports
          </h2>
          <p className="text-sm text-slate-500">
            Generate and share QR-linked passports.
          </p>
        </a>
      </div>
    </div>
  );
}

