import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { OutcomeHero } from "@/components/home/OutcomeHero";
import { RiskStrip } from "@/components/home/RiskStrip";
import { HomeActionCard } from "@/components/home/HomeActionCard";
function HomeCard({


  href,
  label,
  title,
  desc,
}: {
  href: string;
  label: string;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="hover:shadow-md transition">
        <div className="p-5">
          <div className="inline-flex items-center rounded-full bg-[rgb(var(--cz-accent-soft))] px-2.5 py-1 text-xs text-[rgb(var(--cz-accent))] ring-1 ring-emerald-100">
            {label}
          </div>

          <div className="mt-3 text-sm font-medium text-zinc-900">{title}</div>
          <p className="mt-2 text-sm text-zinc-600">{desc}</p>

          <div className="mt-4 text-sm underline text-[rgb(var(--cz-accent))]">
            Open →
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function Home() {
  return (
    <AppShell
      title="Chronozone"
      subtitle="Procurement risk — structured, traceable, defensible."
      crumbs={[{ label: "Home" }]}
      right={
        <div className="flex items-center gap-3">
          <Link
            href="/monitor"
            className="text-sm underline text-[rgb(var(--cz-accent))]"
          >
            Monitor
          </Link>
          <Link
            href="/supplier/alerts"
            className="text-sm underline text-[rgb(var(--cz-accent))]"
          >
            Supplier alerts
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        <Card>
          <CardHeader
            title="What this is"
            subtitle="A decision risk layer for document-heavy procurement."
          />
          <CardBody>
            <div className="space-y-2 text-sm text-zinc-600">
              <p>
                Chronozone surfaces where supplier submissions may expose cost,
                compliance, or audit risk.
              </p>
              <p>
                It does not rank suppliers or make decisions. It highlights what
                requires verification.
              </p>
              <p className="pt-2">
                Intelligence lenses (e.g. regulatory readiness such as NIS2 /
                CBAM / battery passport) are applied <span className="font-medium text-zinc-900">inside Monitor</span> after suppliers submit.
              </p>
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HomeCard
            href="/monitor"
            label="Buyer view"
            title="Monitor"
            desc="Bird’s-eye exposure map across suppliers, topics, and regulatory readiness."
          />
          <HomeCard
            href="/proc/bids"
            label="Procurement"
            title="Bids"
            desc="Procurement events with supplier submissions, packs, and evidence."
          />
          <HomeCard
            href="/supplier/alerts"
            label="Supplier view"
            title="Alerts"
            desc="Supplier-side action list: clarification requests, missing evidence, due dates."
          />
        </div>

        <Card>
          <CardHeader title="Context" subtitle="Where real cost comes from." />
          <CardBody>
            <div className="space-y-2 text-sm text-zinc-600">
              <p>
                Procurement cost is driven by missed detail, duplicated effort,
                and decisions that cannot be defended.
              </p>
              <p>
                Chronozone structures submissions into comparable,
                evidence-linked outputs — so exposures can be identified before
                decisions are made.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
