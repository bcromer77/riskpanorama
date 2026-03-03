import Link from "next/link";
import { Card } from "@/components/ui/Card";

export function HomeActionCard({
  href,
  title,
  metric,
  subtitle,
  bullets,
}: {
  href: string;
  title: string;
  metric: string;
  subtitle: string;
  bullets: string[];
}) {
  return (
    <Link href={href}>
      <Card className="p-5 hover:shadow-md transition">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm font-semibold">{title}</div>
          </div>

          <div className="text-right">
            <div className="text-lg font-semibold">{metric}</div>
            <div className="text-xs text-gray-500">{subtitle}</div>
          </div>
        </div>

        <div className="mt-3 space-y-1 text-sm text-gray-600">
          {bullets.map((b, i) => (
            <div key={i}>• {b}</div>
          ))}
        </div>

        <div className="mt-4 text-sm underline">Open →</div>
      </Card>
    </Link>
  );
}
