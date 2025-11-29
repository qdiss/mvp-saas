"use client"

import { TabType } from "@/types"

type TabNavigationProps = {
    selectedTab: TabType
    onTabChange: (tab: TabType) => void
}

export function TabNavigation({ selectedTab, onTabChange }: TabNavigationProps) {
    const tabs: { value: TabType; label: string }[] = [
        { value: 'overview', label: 'Overview' },
        { value: 'images', label: 'Images' },
        { value: 'pricing', label: 'Pricing' },
        { value: 'content', label: 'Content' },
    ]

    return (
        <div className="flex items-center gap-2 mb-6 bg-white rounded-lg p-1 border border-slate-200 w-fit">
            {tabs.map((tab) => (
                <button
                    key={tab.value}
                    onClick={() => onTabChange(tab.value)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        selectedTab === tab.value
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    )
}