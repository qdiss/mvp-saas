"use client"

import { Product } from "@/types"

type PricingTabProps = {
    myProduct: Product
    competitors: Product[]
}

export function PricingTab({ myProduct, competitors }: PricingTabProps) {
    const selectedCompetitors = competitors.filter(c => c.selected)

    const avgPrice = selectedCompetitors.length > 0
        ? (selectedCompetitors.reduce((sum, c) => sum + c.price, 0) / selectedCompetitors.length).toFixed(2)
        : "0.00"

    const minPrice = selectedCompetitors.length > 0
        ? Math.min(...selectedCompetitors.map(c => c.price)).toFixed(2)
        : "0.00"

    const maxPrice = selectedCompetitors.length > 0
        ? Math.max(...selectedCompetitors.map(c => c.price)).toFixed(2)
        : "0.00"

    return (
        <div className="  rounded-xl border border-slate-200 p-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border-2 border-emerald-200">
                    <p className="text-sm text-emerald-700 font-medium mb-2">Your Price</p>
                    <p className="text-4xl font-bold text-emerald-900">${myProduct.price}</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border-2 border-blue-200">
                    <p className="text-sm text-blue-700 font-medium mb-2">Average Price</p>
                    <p className="text-4xl font-bold text-blue-900">${avgPrice}</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl border-2 border-amber-200">
                    <p className="text-sm text-amber-700 font-medium mb-2">Price Range</p>
                    <p className="text-4xl font-bold text-amber-900">${minPrice}-${maxPrice}</p>
                </div>
            </div>

            {/* Price Comparison List */}
            <div className="space-y-4">
                {/* Your Product */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg border-2 border-emerald-200">
                    <div>
                        <p className="font-semibold text-emerald-900">{myProduct.name}</p>
                        <p className="text-sm text-emerald-600 font-medium mt-1">Your Product</p>
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">${myProduct.price}</p>
                </div>

                {/* Competitors */}
                {selectedCompetitors.map((comp) => {
                    const priceDiff = ((comp.price - myProduct.price) / myProduct.price * 100).toFixed(1)
                    const isHigher = comp.price > myProduct.price

                    return (
                        <div
                            key={comp.id}
                            className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                        >
                            <div className="flex-1">
                                <p className="font-semibold   ">{comp.name}</p>
                                <p className="text-sm    mt-1">{comp.asin}</p>
                            </div>
                            <div className="text-right ml-4">
                                <p className="text-2xl font-bold   ">${comp.price}</p>
                                <p className={`text-sm font-medium ${
                                    isHigher ? 'text-red-600' : 'text-green-600'
                                }`}>
                                    {isHigher ? '+' : ''}{priceDiff}%
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Price Insights */}
            {selectedCompetitors.length > 0 && (
                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2">💡 Price Insights</h3>
                    <div className="space-y-1 text-sm text-blue-800">
                        {parseFloat(avgPrice) > myProduct.price && (
                            <p>• Your product is <b>{((1 - myProduct.price / parseFloat(avgPrice)) * 100).toFixed(0)}% cheaper</b> than the average competitor price.</p>
                        )}
                        {parseFloat(avgPrice) < myProduct.price && (
                            <p>• Your product is <b>{((myProduct.price / parseFloat(avgPrice) - 1) * 100).toFixed(0)}% more expensive</b> than the average competitor price.</p>
                        )}
                        <p>• Competitor prices range from <b>${minPrice}</b> to <b>${maxPrice}</b>.</p>
                    </div>
                </div>
            )}
        </div>
    )
}