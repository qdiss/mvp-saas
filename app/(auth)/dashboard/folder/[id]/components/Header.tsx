"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

type HeaderProps = {
    selectedCount: number
}

export function Header({ selectedCount }: HeaderProps) {
    const router = useRouter()

    return (
        <header className="mb-6">
            <div className="flex items-center gap-4 mb-4">
                <button
                    className="p-2    rounded-lg transition-colors"
                    onClick={() => router.push('/dashboard')}
                >
                    <ArrowLeft className="h-5 w-5   " />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-semibold   ">
                        Eye Care Products - Competitive Analysis
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Compare your product with {selectedCount} competitors
                    </p>
                </div>
            </div>
        </header>
    )
}