"use client"

import React, { useState, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Package, Plus } from "lucide-react"

import { Product, TabType } from "@/types"
import { MOCK_DATA_FOLDER_ID, myProductInit, competitorsInit } from "@/utils/mockData"
import { Header } from "./components/Header"
import { StatsCards } from "./components/StatsCards"
import { TabNavigation } from "./components/TabNavigation"
import { OverviewTab } from "./components/tabs/OverviewTab"
import { ImagesTab } from "./components/tabs/ImagesTab"
import { PricingTab } from "./components/tabs/PricingTab"
import { ContentTab } from "./components/tabs/ContentTab"

export default function CompetitiveAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id } = use(params)
    const hasMockData = id === MOCK_DATA_FOLDER_ID

    const [myProduct, setMyProduct] = useState<Product>(
        hasMockData ? myProductInit : {
            id: "my-1",
            name: "",
            price: 0,
            rating: 0,
            reviews: 0,
            photos: [],
        }
    )

    const [competitors, setCompetitors] = useState<Product[]>(
        hasMockData ? competitorsInit : []
    )

    const [selectedTab, setSelectedTab] = useState<TabType>('overview')

    const toggleCompetitor = (id: string) => {
        setCompetitors(prev =>
            prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p)
        )
    }

    const updateCompetitor = (id: string, updater: (p: Product) => Product) => {
        setCompetitors(prev => prev.map(p => p.id === id ? updater(p) : p))
    }

    const selectedCompetitors = competitors.filter(c => c.selected)

    // Empty State
    if (!hasMockData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
                <div className="max-w-[1400px] mx-auto">
                    <header className="mb-6">
                        <div className="flex items-center gap-4 mb-4">
                            <button
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                onClick={() => router.push('/dashboard')}
                            >
                                <ArrowLeft className="h-5 w-5 text-slate-600" />
                            </button>
                            <div className="flex-1">
                                <h1 className="text-2xl font-semibold text-slate-900">
                                    Competitive Analysis
                                </h1>
                            </div>
                        </div>
                    </header>

                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Package className="h-8 w-8 text-slate-400" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900 mb-2">
                                No Competitive Analysis Yet
                            </h2>
                            <p className="text-slate-600 mb-6">
                                Start by adding competitors to analyze for this folder. Connect to Amazon API to fetch product data automatically.
                            </p>
                            <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 mx-auto font-medium">
                                <Plus className="h-5 w-5" />
                                Add First Competitor
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
            <div className="max-w-[1400px] mx-auto">
                <Header selectedCount={selectedCompetitors.length} />
                
                <StatsCards myProduct={myProduct} competitors={selectedCompetitors} />

                <div className="mt-6">
                    <TabNavigation selectedTab={selectedTab} onTabChange={setSelectedTab} />

                    {selectedTab === 'overview' && (
                        <OverviewTab
                            myProduct={myProduct}
                            competitors={competitors}
                            onToggleCompetitor={toggleCompetitor}
                        />
                    )}

                    {selectedTab === 'images' && (
                        <ImagesTab
                            myProduct={myProduct}
                            competitors={competitors}
                            onUpdateProduct={setMyProduct}
                            onUpdateCompetitor={updateCompetitor}
                        />
                    )}

                    {selectedTab === 'pricing' && (
                        <PricingTab
                            myProduct={myProduct}
                            competitors={selectedCompetitors}
                        />
                    )}

                    {selectedTab === 'content' && (
                        <ContentTab
                            myProduct={myProduct}
                            competitors={selectedCompetitors}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}