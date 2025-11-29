"use client"

import { Eye } from "lucide-react"
import { Product } from "@/types"

type CompetitorsListProps = {
    competitors: Product[]
    myProduct: Product
    onToggleCompetitor: (id: string) => void
}

export function CompetitorsList({ competitors, myProduct, onToggleCompetitor }: CompetitorsListProps) {
    return (
        <div className="bg-white rounded-xl border border-slate-200">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">
                    All Competitors ({competitors.length})
                </h2>
                <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                    Find More
                </button>
            </div>
            <div className="divide-y divide-slate-100">
                {competitors.map((comp) => (
                    <CompetitorItem
                        key={comp.id}
                        competitor={comp}
                        myProduct={myProduct}
                        onToggle={() => onToggleCompetitor(comp.id)}
                    />
                ))}
            </div>
        </div>
    )
}

type CompetitorItemProps = {
    competitor: Product
    myProduct: Product
    onToggle: () => void
}

function CompetitorItem({ competitor, myProduct, onToggle }: CompetitorItemProps) {
    const priceDiff = ((competitor.price - myProduct.price) / myProduct.price * 100).toFixed(0)
    const isHigher = competitor.price > myProduct.price

    return (
        <div
            className={`p-4 hover:bg-slate-50 transition-colors ${
                competitor.selected ? 'bg-emerald-50/30' : ''
            }`}
        >
            <div className="flex items-center gap-4">
                <input
                    type="checkbox"
                    checked={!!competitor.selected}
                    onChange={onToggle}
                    className="w-5 h-5 rounded border-2 cursor-pointer accent-emerald-600"
                />
                <img
                    src={competitor.image}
                    alt={competitor.name}
                    className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                />
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 text-sm">
                            {competitor.name}
                        </h3>
                        {competitor.isSponsored && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                                Sponsored
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500">{competitor.asin}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right min-w-[100px]">
                        <p className="text-lg font-bold text-slate-900">
                            ${competitor.price}
                        </p>
                        <p className={`text-xs ${isHigher ? 'text-red-600' : 'text-green-600'}`}>
                            {isHigher ? '+' : ''}{priceDiff}%
                            {isHigher ? ' higher' : ' lower'}
                        </p>
                    </div>
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <Eye className="h-4 w-4 text-slate-400" />
                    </button>
                </div>
            </div>
        </div>
    )
}