"use client";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const sampleRisks = [
  { type: "Battery", icon: "🔋", severity: "High", metric: "22% Bauxite Exposure", color: "bg-red-100" },
  { type: "Logistics", icon: "🚚", severity: "Medium", metric: "Reverse logistics backlog", color: "bg-yellow-100" },
  { type: "Regulatory", icon: "⚖️", severity: "Medium", metric: "CBAM compliance review", color: "bg-blue-100" },
  { type: "Environmental", icon: "🌍", severity: "Low", metric: "Waterworks disruption", color: "bg-green-100" },
];

export default function PolaroidRiskBoard() {
  return (
    <div className="p-6 mt-6 bg-slate-50 rounded-xl border border-slate-200">
      <h2 className="text-lg font-semibold mb-4 text-slate-700">
        📸 Polaroid Risk Board — City Risk Snapshots
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sampleRisks.map((r, i) => (
          <motion.div
            key={r.type}
            className="relative"
            initial={{ rotate: (i % 2 === 0 ? 2 : -2), y: 10, opacity: 0 }}
            animate={{ rotate: 0, y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            whileHover={{ y: -8, scale: 1.03, rotate: 0 }}
          >
            <Card className={`${r.color} border-0 shadow-md hover:shadow-lg`}>
              <div className="absolute top-2 right-2 bg-white/80 rounded-full px-2 py-1 text-xs font-bold">
                {r.severity}
              </div>
              <CardContent className="p-5">
                <div className="text-4xl mb-2">{r.icon}</div>
                <h3 className="font-bold text-slate-800 text-lg mb-1">{r.type}</h3>
                <p className="text-sm text-slate-700 mb-2">{r.metric}</p>
                <button className="text-xs text-blue-600 underline">
                  View Docs
                </button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

