// app/folders/[id]/components/DebugDataView.tsx
// Temporary component da vidiš SVE što imaš

"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface DebugDataViewProps {
  myProduct: any;
  competitors: any[];
}

export function DebugDataView({ myProduct, competitors }: DebugDataViewProps) {
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});

  const toggleSection = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderValue = (value: any, depth = 0): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">null</span>;
    }

    if (typeof value === "boolean") {
      return <span className="text-purple-600">{value.toString()}</span>;
    }

    if (typeof value === "number") {
      return <span className="text-blue-600">{value}</span>;
    }

    if (typeof value === "string") {
      return <span className="text-green-600">"{value}"</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-400">[]</span>;
      }
      return (
        <div className="ml-4">
          <span className="text-gray-500">[{value.length} items]</span>
          {value.slice(0, 3).map((item, i) => (
            <div key={i} className="ml-4">
              {i}: {renderValue(item, depth + 1)}
            </div>
          ))}
          {value.length > 3 && (
            <div className="ml-4 text-gray-400">
              ... +{value.length - 3} more
            </div>
          )}
        </div>
      );
    }

    if (typeof value === "object") {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return <span className="text-gray-400">{"{}"}</span>;
      }

      return (
        <div className="ml-4">
          {keys.slice(0, 5).map((key) => (
            <div key={key} className="mb-1">
              <span className="text-orange-600">{key}</span>:{" "}
              {renderValue(value[key], depth + 1)}
            </div>
          ))}
          {keys.length > 5 && (
            <div className="text-gray-400">
              ... +{keys.length - 5} more keys
            </div>
          )}
        </div>
      );
    }

    return <span>{String(value)}</span>;
  };

  return (
    <div className="bg-slate-900 text-white p-6 rounded-lg overflow-auto max-h-[600px] font-mono text-sm">
      <h2 className="text-xl font-bold mb-4 text-yellow-400">
        🔍 Debug: All Data
      </h2>

      {/* MY PRODUCT */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("myProduct")}
          className="flex items-center gap-2 text-lg font-semibold text-blue-400 hover:text-blue-300"
        >
          {expanded.myProduct ? <ChevronDown /> : <ChevronRight />}
          MY PRODUCT ({Object.keys(myProduct).length} fields)
        </button>

        {expanded.myProduct && (
          <div className="mt-2 ml-4 space-y-1">
            {Object.entries(myProduct).map(([key, value]) => (
              <div key={key} className="border-l-2 border-blue-500 pl-3">
                <span className="text-cyan-400">{key}</span>:{" "}
                {renderValue(value)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* COMPETITORS */}
      <div>
        <button
          onClick={() => toggleSection("competitors")}
          className="flex items-center gap-2 text-lg font-semibold text-green-400 hover:text-green-300"
        >
          {expanded.competitors ? <ChevronDown /> : <ChevronRight />}
          COMPETITORS ({competitors.length} total)
        </button>

        {expanded.competitors && (
          <div className="mt-2 ml-4 space-y-4">
            {competitors.map((comp, idx) => (
              <div
                key={comp.id || idx}
                className="border-l-2 border-green-500 pl-3"
              >
                <div className="font-bold text-green-300 mb-2">
                  Competitor #{idx + 1} - {comp.name?.substring(0, 50)}...
                </div>
                <div className="ml-4 space-y-1">
                  {Object.entries(comp).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-yellow-400">{key}</span>:{" "}
                      {renderValue(value)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h3 className="font-bold text-pink-400 mb-2">Quick Stats:</h3>
        <div className="space-y-1 text-xs">
          <div>✓ My Product Fields: {Object.keys(myProduct).length}</div>
          <div>✓ Competitors: {competitors.length}</div>
          <div>✓ My Product Photos: {myProduct.photos?.length || 0}</div>
          <div>✓ My Product Features: {myProduct.features?.length || 0}</div>
          <div>✓ My Product Specs: {myProduct.specifications?.length || 0}</div>
          <div>✓ Has Raw Data: {myProduct.rawData ? "✓ Yes" : "✗ No"}</div>
        </div>
      </div>
    </div>
  );
}
