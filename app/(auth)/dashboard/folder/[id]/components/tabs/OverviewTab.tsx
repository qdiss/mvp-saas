"use client"

import { Eye } from "lucide-react"
import { Product } from "@/types"
import { ComparisonMetric } from "../ComparisonMetric"

type OverviewTabProps = {
    myProduct: Product
    competitors: Product[]
    onToggleCompetitor: (id: string) => void
}

export function OverviewTab({ myProduct, competitors, onToggleCompetitor }: OverviewTabProps) {
    const selectedCompetitors = competitors.filter(c => c.selected)

    return (
        <div className="space-y-6">
            {/* Comparison Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 p-4">
                    <h2 className="font-semibold text-slate-900">Product Comparison</h2>
                </div>
                <div className="p-6">
                    {/* Table Header */}
                    <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `repeat(${2 + selectedCompetitors.length}, minmax(0, 1fr))` }}>
                        <div className="font-semibold text-slate-700">Metric</div>
                        <div className="font-semibold text-emerald-700 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg px-3 py-2 text-center border-2 border-emerald-200">
                            Your Product
                        </div>
                        {selectedCompetitors.map((comp, idx) => (
                            <div 
                                key={comp.id} 
                                className="font-semibold text-slate-700 bg-slate-50 rounded-lg px-3 py-2 text-center text-sm border border-slate-200"
                            >
                                Competitor {idx + 1}
                            </div>
                        ))}
                    </div>

                    {/* Metrics */}
                    <ComparisonMetric 
                        label="Price" 
                        myValue={`$${myProduct.price}`} 
                        competitorValues={selectedCompetitors.map(c => `$${c.price}`)} 
                    />
                    <ComparisonMetric 
                        label="Rating" 
                        myValue={myProduct.rating > 0 ? `${myProduct.rating} ⭐` : 'New Product'} 
                        competitorValues={selectedCompetitors.map(c => `${c.rating} ⭐`)} 
                    />
                    <ComparisonMetric 
                        label="Reviews" 
                        myValue={myProduct.reviews.toLocaleString()} 
                        competitorValues={selectedCompetitors.map(c => c.reviews.toLocaleString())} 
                    />
                    <ComparisonMetric 
                        label="Images" 
                        myValue={myProduct.photos.length} 
                        competitorValues={selectedCompetitors.map(c => c.photos.length)} 
                    />
                    <ComparisonMetric 
                        label="Sponsored" 
                        myValue={myProduct.isSponsored ? '✓ Yes' : '✗ No'} 
                        competitorValues={selectedCompetitors.map(c => c.isSponsored ? '✓ Yes' : '✗ No')} 
                    />
                </div>
            </div>

            {/* Competitors List */}
            <CompetitorsList 
                competitors={competitors}
                myProduct={myProduct}
                onToggleCompetitor={onToggleCompetitor}
            />
        </div>
    )
}

type CompetitorsListProps = {
    competitors: Product[]
    myProduct: Product
    onToggleCompetitor: (id: string) => void
}

function CompetitorsList({ competitors, myProduct, onToggleCompetitor }: CompetitorsListProps) {
    return (
        <div className="bg-white rounded-xl border border-slate-200">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">All Competitors ({competitors.length})</h2>
                <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                    Find More
                </button>
            </div>
            <div className="divide-y divide-slate-100">
                {competitors.map((comp) => (
                    <div
                        key={comp.id}
                        className={`p-4 hover:bg-slate-50 transition-colors ${
                            comp.selected ? 'bg-emerald-50/30' : ''
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <input
                                type="checkbox"
                                checked={!!comp.selected}
                                onChange={() => onToggleCompetitor(comp.id)}
                                className="w-5 h-5 rounded border-2 cursor-pointer accent-emerald-600"
                            />
                            <img 
                                src={comp.image} 
                                alt={comp.name} 
                                className="w-16 h-16 rounded-lg object-cover border border-slate-200" 
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-slate-900 text-sm">
                                        {comp.name}
                                    </h3>
                                    {comp.isSponsored && (
                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                                            Sponsored
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500">{comp.asin}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right min-w-[100px]">
                                    <p className="text-lg font-bold text-slate-900">${comp.price}</p>
                                    <p className="text-xs text-slate-500">
                                        {((comp.price - myProduct.price) / myProduct.price * 100).toFixed(0)}%
                                        {comp.price > myProduct.price ? ' higher' : ' lower'}
                                    </p>
                                </div>
                                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                    <Eye className="h-4 w-4 text-slate-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}