"use client";

export default function RetailersPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Retailer Intelligence</h1>
      <p className="text-sm text-slate-500">
        Track supplier compliance, view linked passports, and respond to new regulatory risks.
      </p>

      <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-800 mb-2">Recent Supplier Risks</h2>
        <div className="text-sm text-slate-700 space-y-2">
          <p>
            <span className="font-medium text-slate-900">BatteryPlus Ltd</span> — Risk 90%
          </p>
          <p className="text-xs text-slate-500">
            Missing Battery Passport for SKU-4782. <a href="/passport" className="text-emerald-700 underline">Request passport</a>.
          </p>
        </div>
      </div>
    </main>
  );
}

