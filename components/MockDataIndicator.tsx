// components/MockModeIndicator.tsx
"use client";

import { Sparkles, ExternalLink } from "lucide-react";

export function MockModeIndicator() {
  const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

  if (!isMockMode) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="p-3 bg-amber-500 text-white rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium">
        <Sparkles className="h-4 w-4" />
        <span>Mock Mode Active</span>
        <a
          href="/docs/mock-data"
          className="ml-2 underline flex items-center gap-1 hover:text-amber-100"
          target="_blank"
        >
          View ASINs
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
