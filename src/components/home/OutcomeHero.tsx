import Link from "next/link";
import { Card } from "@/components/ui/Card";

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "danger" | "warn" | "good";
}) {
  const toneStyles: Record<string, string> = {
    neutral: "bg-white ring-black/10",
    danger: "bg-red-50 ring-red-200 text-red-900",
    warn: "bg-amber-50 ring-amber-200",
    good: "bg-emerald-50 ring-emerald-200",
  };

  return (
    <div className={`rounded-xl px-3.5 py-3 ring-1 ${toneStyles[tone]}`}>
      <div className="text-[11px] uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

export function OutcomeHero() {
  return (
    <Card className="overflow-hidden">
      <div className="p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="text-xs text-gray-500">
              Evidence-linked procurement risk intelligence
            </div>

            <h2 className="mt-2 text-3xl font-semibold">
              Potential exposure identified across current procurement
            </h2>

            <p className="mt-2 text-gray-600">
              Chronozone surfaces where supplier submissions may introduce
              financial, compliance, or audit risk — based on available evidence
              and subject to verification.
            </p>

            <div className="mt-5 flex gap-3">
              <Link
                href="/monitor"
                className="px-4 py-2 rounded-lg bg-black text-white text-sm"
              >
                Open Monitor →
              </Link>

              <Link
                href="/proc/bids"
                className="px-4 py-2 rounded-lg border text-sm"
              >
                View procurement
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full lg:w-[320px]">
            <Stat label="Items flagged" value="3" tone="danger" />
            <Stat label="Suppliers in scope" value="18" tone="warn" />
            <Stat label="Audit-ready" value="67%" tone="good" />
            <Stat label="Tracked submissions" value="42" tone="neutral" />
          </div>
        </div>
      </div>
    </Card>
  );
}
