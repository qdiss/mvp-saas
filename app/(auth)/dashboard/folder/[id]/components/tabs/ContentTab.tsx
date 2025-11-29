"use client"

import { FileText, CheckCircle2 } from "lucide-react"
import { Product } from "@/types"

type ContentTabProps = {
    myProduct: Product
    competitors: Product[]
}

export function ContentTab({ myProduct, competitors }: ContentTabProps) {
    const selectedCompetitors = competitors.filter(c => c.selected)

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            {/* Product Titles */}
            <TitlesSection myProduct={myProduct} competitors={selectedCompetitors} />

            {/* Product Descriptions */}
            <DescriptionsSection myProduct={myProduct} competitors={selectedCompetitors} />

            {/* Bullet Points */}
            <BulletPointsSection myProduct={myProduct} competitors={selectedCompetitors} />
        </div>
    )
}

type SectionProps = {
    myProduct: Product
    competitors: Product[]
}

function TitlesSection({ myProduct, competitors }: SectionProps) {
    return (
        <div className="mb-8">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-600" />
                Product Titles
            </h3>
            <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${1 + competitors.length}, minmax(0, 1fr))` }}
            >
                {/* My Product */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-lg p-4">
                    <div className="text-xs font-semibold text-emerald-700 mb-2">YOUR PRODUCT</div>
                    <p className="text-sm text-slate-900 leading-relaxed mb-2">{myProduct.name}</p>
                    <div className="text-xs text-emerald-600 font-medium">
                        {myProduct.name.length} characters
                    </div>
                </div>

                {/* Competitors */}
                {competitors.map((comp, idx) => (
                    <div key={comp.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <div className="text-xs font-semibold text-slate-600 mb-2">
                            COMPETITOR {idx + 1}
                        </div>
                        <p className="text-sm text-slate-900 leading-relaxed mb-2">{comp.name}</p>
                        <div className="text-xs text-slate-500 font-medium">
                            {comp.name.length} characters
                            {comp.name.length !== myProduct.name.length && (
                                <span className={comp.name.length > myProduct.name.length ? 'text-amber-600' : 'text-green-600'}>
                                    {' • '}
                                    {comp.name.length > myProduct.name.length ? '+' : ''}
                                    {comp.name.length - myProduct.name.length}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function DescriptionsSection({ myProduct, competitors }: SectionProps) {
    return (
        <div className="mb-8">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-600" />
                Product Descriptions
            </h3>
            <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${1 + competitors.length}, minmax(0, 1fr))` }}
            >
                {/* My Product */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-lg p-4">
                    <div className="text-xs font-semibold text-emerald-700 mb-2">YOUR PRODUCT</div>
                    <p className="text-sm text-slate-700 leading-relaxed">{myProduct.description}</p>
                </div>

                {/* Competitors */}
                {competitors.map((comp, idx) => (
                    <div key={comp.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <div className="text-xs font-semibold text-slate-600 mb-2">
                            COMPETITOR {idx + 1}
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{comp.description}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

function BulletPointsSection({ myProduct, competitors }: SectionProps) {
    return (
        <div>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-slate-600" />
                Key Features / Bullet Points
            </h3>
            <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${1 + competitors.length}, minmax(0, 1fr))` }}
            >
                {/* My Product */}
                <div className="space-y-2">
                    <div className="text-xs font-semibold text-emerald-700 mb-3 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-lg p-2">
                        YOUR PRODUCT ({myProduct.bulletPoints?.length ?? 0} points)
                    </div>
                    {(myProduct.bulletPoints || []).map((point, idx) => (
                        <div
                            key={idx}
                            className="flex items-start gap-2 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-lg p-3"
                        >
                            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                {idx + 1}
                            </div>
                            <span className="text-sm text-slate-700 leading-relaxed">{point}</span>
                        </div>
                    ))}
                </div>

                {/* Competitors */}
                {competitors.map((comp, compIdx) => (
                    <div key={comp.id} className="space-y-2">
                        <div className="text-xs font-semibold text-slate-600 mb-3 bg-slate-50 border border-slate-200 rounded-lg p-2">
                            COMPETITOR {compIdx + 1} ({comp.bulletPoints?.length ?? 0} points)
                        </div>
                        {(comp.bulletPoints || []).map((point, idx) => (
                            <div
                                key={idx}
                                className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3"
                            >
                                <div className="w-5 h-5 rounded-full bg-slate-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {idx + 1}
                                </div>
                                <span className="text-sm text-slate-700 leading-relaxed">{point}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}