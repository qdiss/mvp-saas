// app/folders/[id]/components/TabNavigation.tsx
// UPDATED: Added Video and A+ Content tabs

import React from "react";
import {
  LayoutGrid,
  Image,
  Video,
  DollarSign,
  FileText,
  Sparkles,
} from "lucide-react";
import { TabType } from "@/types";

type TabNavigationProps = {
  selectedTab: TabType;
  onTabChange: (tab: TabType) => void;
};

export function TabNavigation({
  selectedTab,
  onTabChange,
}: TabNavigationProps) {
  const tabs = [
    {
      id: "overview" as TabType,
      label: "Overview",
      icon: LayoutGrid,
      description: "Product comparison overview",
    },
    {
      id: "images" as TabType,
      label: "Images",
      icon: Image,
      description: "Product images comparison",
    },
    {
      id: "videos" as TabType,
      label: "Videos",
      icon: Video,
      description: "Product videos",
    },
    {
      id: "pricing" as TabType,
      label: "Pricing",
      icon: DollarSign,
      description: "Price comparison",
    },
    {
      id: "content" as TabType,
      label: "Content",
      icon: FileText,
      description: "Features & descriptions",
    },
    {
      id: "aplus" as TabType,
      label: "A+ Content",
      icon: Sparkles,
      description: "Enhanced content & brand story",
    },
  ];

  return (
    <div className="border-b border-slate-200 mb-6">
      <div className="flex gap-2 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group relative flex items-center gap-2 px-4 py-3 rounded-t-lg transition-all whitespace-nowrap ${
                isActive
                  ? "bg-white border-2 border-b-0 border-slate-200 -mb-0.5"
                  : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  isActive
                    ? "text-blue-500"
                    : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              <span
                className={`font-medium text-sm ${
                  isActive ? "text-slate-900" : ""
                }`}
              >
                {tab.label}
              </span>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {tab.description}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
