export function RiskStrip() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="p-4 rounded-xl bg-red-50 border border-red-200">
        <div className="text-xs">High risk (indicative)</div>
        <div className="text-lg font-semibold text-red-700">Needs action</div>
        <div className="text-xs text-gray-500">
          Missing or conflicting evidence identified
        </div>
      </div>

      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
        <div className="text-xs">Needs review</div>
        <div className="text-lg font-semibold text-amber-700">
          Verification required
        </div>
        <div className="text-xs text-gray-500">
          Requires confirmation before decision
        </div>
      </div>

      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
        <div className="text-xs">Evidence present</div>
        <div className="text-lg font-semibold text-emerald-700">
          Currently supported
        </div>
        <div className="text-xs text-gray-500">
          Evidence present based on current submissions
        </div>
      </div>
    </div>
  );
}
