'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type Report = {
  persona: string;
  county: string;
  report: {
    executive_summary: string;
    benefits: string[];
    quick_actions: string[];
  };
};

export default function ReportsDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // fetch the most recent reports from your API
    fetch('/api/report/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'battery quality issues and supply chain risk',
        personas: ['council', 'electricity_provider'],
        region: 'Golden Vale',
        counties: ['Tipperary', 'Limerick', 'Cork'],
        topK: 15,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.reports)) {
          setReports(data.reports);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-400">
        Generating Veracity101 reports…
      </div>
    );
  }

  return (
    <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50 min-h-screen">
      {reports.map((r, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="rounded-2xl bg-white p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all"
        >
          <div className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
            {r.persona} — {r.county}
          </div>
          <p className="mt-2 text-gray-800 text-sm leading-relaxed">
            {r.report.executive_summary}
          </p>

          <div className="mt-4">
            <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2">
              Key Benefits
            </h3>
            <ul className="list-disc ml-4 space-y-1 text-sm text-gray-700">
              {r.report.benefits.slice(0, 3).map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2">
              Quick Actions
            </h3>
            <ul className="list-disc ml-4 space-y-1 text-sm text-gray-700">
              {r.report.quick_actions.slice(0, 3).map((a, j) => (
                <li key={j}>{a}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

