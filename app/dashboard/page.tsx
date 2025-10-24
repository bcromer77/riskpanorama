"use client";

import useSWR from "swr";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  const { data, error } = useSWR("/api/risk/list", fetcher);

  if (error) return <div className="p-8 text-red-500">Error loading risks</div>;
  if (!data) return <div className="p-8 text-slate-500">Loading...</div>;

  const total = data.risks?.length || 0;
  const highRisk = data.risks.filter((r: any) => r.risk_score > 0.7).length;
  const compliant = data.risks.filter((r: any) => r.risk_score < 0.3).length;

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Supplier Risk Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold">{total}</p><p className="text-sm text-muted-foreground">Total Reports</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-red-600">{highRisk}</p><p className="text-sm text-muted-foreground">High Risk</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-green-600">{compliant}</p><p className="text-sm text-muted-foreground">Compliant</p></CardContent></Card>
      </div>

      <div className="space-y-3">
        {data.risks.map((r: any, i: number) => (
          <Card key={i} className="border shadow-sm">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-slate-900">{r.supplier}</h2>
                <p className="text-sm text-slate-600">SKU: {r.sku}</p>
                <p className="text-xs text-slate-500 mt-1">{new Date(r.timestamp).toLocaleString()}</p>
              </div>
              <Badge
                className={`${
                  r.risk_score > 0.7
                    ? "bg-red-100 text-red-700"
                    : r.risk_score > 0.4
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {(r.risk_score * 100).toFixed(0)}%
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}

