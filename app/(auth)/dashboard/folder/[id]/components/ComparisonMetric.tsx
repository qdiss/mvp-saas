"use client"

type ComparisonMetricProps = {
    label: string
    myValue: React.ReactNode
    competitorValues: React.ReactNode[]
}

export function ComparisonMetric({ label, myValue, competitorValues }: ComparisonMetricProps) {
    const columns = 2 + competitorValues.length

    return (
        <div className="border-b border-slate-200 last:border-0">
            <div
                className="grid gap-4 py-4"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
                <div className="font-medium text-slate-700 text-sm">{label}</div>
                <div className="font-semibold text-emerald-700 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg px-3 py-2 text-sm text-center border-2 border-emerald-200">
                    {myValue}
                </div>
                {competitorValues.map((value, idx) => (
                    <div
                        key={idx}
                        className="   bg-slate-50 rounded-lg px-3 py-2 text-sm text-center border border-slate-200"
                    >
                        {value}
                    </div>
                ))}
            </div>
        </div>
    )
}