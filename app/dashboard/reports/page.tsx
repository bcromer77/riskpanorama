'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type ReportRecord = {
  _id?: string;
  persona: string;
  county: string;
  region?: string;
  createdAt?: string;
  report: {
    executive_summary?: string;
    benefits?: string[];
    quick_actions?: string[];
    program_blueprint?: any;
    pilot_plan?: any;
  };
};

export default function ReportsDashboard() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch('/api/reports');
        const data = await res.json();
        if (data?.success && Array.isArray(data.reports)) {
          setReports(data.reports);
        }
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-400">
        Loading saved reports…
      </div>
    );
  }

  if (!reports.length) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-400">
        No reports found in database.
      </div>
    );
  }

  return (
    <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50 min-h-screen">
      {reports.map((r, i) => (
        <motion.div
          key={r._id || i}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-2xl bg-white p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all"
        >
          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
            {r.persona} — {r.county}
          </div>
          <div className="text-[11px] text-gray-500 mb-2">
            {r.region || '—'} {r.createdAt ? `• ${new Date(r.createdAt).toLocaleDateString()}` : ''}
          </div>

          <p className="mt-2 text-gray-800 text-sm leading-relaxed line-clamp-5">
            {r.report?.executive_summary || 'No summary available.'}
          </p>

          <div className="mt-4">
            <h3 className="text-xs uppercase text-gray-500 font-semibold mb-1">
              Key Benefits
            </h3>
            <ul className="list-disc ml-4 space-y-1 text-sm text-gray-700">
              {r.report?.benefits?.slice(0, 3)?.map((b, j) => (
                <li key={j}>{b}</li>
              )) || <li>No benefits listed.</li>}
            </ul>
          </div>

          <div className="mt-4">
            <h3 className="text-xs uppercase text-gray-500 font-semibold mb-1">
              Quick Actions
            </h3>
            <ul className="list-disc ml-4 space-y-1 text-sm text-gray-700">
              {r.report?.quick_actions?.slice(0, 3)?.map((a, j) => (
                <li key={j}>{a}</li>
              )) || <li>No actions listed.</li>}
            </ul>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

