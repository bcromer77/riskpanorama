"use client";

import { Badge } from "@/components/ui/badge";
import { judgeIntegrity } from "@/lib/integrity";

export default function IntegrityBadge({ hash }: { hash?: string }) {
  const state = judgeIntegrity(hash);

  if (state === "Verified") {
    return (
      <Badge className="bg-emerald-900/40 text-emerald-300 border-emerald-600 text-xs flex items-center">
        <span className="w-2 h-2 bg-emerald-400 rounded-full mr-1.5"></span>
        Integrity: Verified
      </Badge>
    );
  }

  return (
    <Badge className="bg-gray-800 text-gray-300 border-gray-700 text-xs flex items-center">
      <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1.5"></span>
      Integrity: Pending
    </Badge>
  );
}

