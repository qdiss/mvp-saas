//src/app/(auth)/dashboard/folder/[id]/page.tsx
"use client"

import React, { useState, useMemo, useCallback } from "react"
import {
    ArrowLeft,
    Plus,
    Eye,
    FileImage,
    Star,
    DollarSign,
    Package,
    CheckCircle2,
    FileText,
} from "lucide-react"

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { useDropzone } from "react-dropzone"

// ---------------------- Types ----------------------
type Product = {
    id: string
    name: string
    asin?: string
    image?: string
    price: number
    rating: number
    reviews: number
    rank?: string
    isSponsored?: boolean
    selected?: boolean
    photos: string[]
    description?: string
    bulletPoints?: string[]
}

// ---------------------- Mock Data ----------------------

const myProductInit: Product = {
    id: "my-1",
    name: "Premium Cooling Eye Mask - Therapeutic Gel Beads",
    asin: "B0MYPRODUCT",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
    price: 24.99,
    rating: 0,
    reviews: 0,
    isSponsored: false,
    photos: [
        "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
    ],
    description: "Premium therapeutic eye mask with cooling gel beads. Perfect for reducing puffiness, dark circles, and eye strain.",
    bulletPoints: ["Hot & Cold Therapy", "Reusable & Durable", "Ergonomic Design", "Medical Grade Materials"],
}

const competitorsInit: Product[] = [
    {
        id: "comp-1",
        name: "USA Merchant - 2 Redesigned Therapeutic Spa Gel Bead Eye Masks",
        asin: "B0195CAWID",
        image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=400&fit=crop",
        price: 22.99,
        rating: 4.5,
        reviews: 2847,
        rank: "#12 in Eye Care",
        isSponsored: true,
        selected: true,
        photos: [
            "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=400&fit=crop",
            "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop",
        ],
        description: "Therapeutic spa gel bead eye masks for hot and cold therapy. Reduce puffiness and soothe tired eyes.",
        bulletPoints: ["Spa Quality", "Hot/Cold Use", "Set of 2 Masks", "Adjustable Strap"],
    },
    {
        id: "comp-2",
        name: "HOT & COLD EYE PADS (CUCUMBER)",
        asin: "B086B2D6YX",
        image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&h=400&fit=crop",
        price: 19.99,
        rating: 4.3,
        reviews: 1523,
        rank: "#28 in Eye Care",
        isSponsored: false,
        selected: true,
        photos: ["https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&h=400&fit=crop"],
        description: "Cucumber infused eye pads for cooling relief. Natural ingredients for sensitive skin.",
        bulletPoints: ["Cucumber Infused", "Natural Relief", "Sensitive Skin Safe", "Disposable Pads"],
    },
    {
        id: "comp-3",
        name: "Luctude Gel Eye Mask Cooling Eye Mask for Dry Eyes",
        asin: "B09Y8XC1PC",
        image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop",
        price: 16.99,
        rating: 4.7,
        reviews: 3245,
        rank: "#8 in Eye Care",
        isSponsored: true,
        selected: false,
        photos: [
            "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop",
            "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop",
        ],
        description: "Cooling gel eye mask designed for dry eyes. Long-lasting cold therapy for maximum relief.",
        bulletPoints: ["Dry Eye Relief", "Long Lasting Cold", "Comfortable Fit", "Dermatologist Tested"],
    },
]

// ---------------------- ComparisonMetric ----------------------

function ComparisonMetric({ label, myValue, competitorValues }: { label: string; myValue: React.ReactNode; competitorValues: React.ReactNode[] }) {
    const columns = 2 + competitorValues.length
    return (
        <div className="border-b border-slate-200 last:border-0">
            <div className="grid gap-4 py-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
                <div className="font-medium text-slate-700 text-sm">{label}</div>
                <div className="font-semibold text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 text-sm text-center">{myValue}</div>
                {competitorValues.map((value, idx) => (
                    <div key={idx} className="text-slate-600 bg-slate-50 rounded-lg px-3 py-2 text-sm text-center">
                        {value}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ---------------------- SortableImage ----------------------
function SortableImage({ id, src, onOpenReview }: { id: string; src: string; onOpenReview: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 999 : 'auto',
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative group cursor-move">
            <div className="aspect-square rounded-lg overflow-hidden border border-slate-200">
                <img src={src} alt={id} className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onOpenReview(id)
                    }}
                    className="bg-white px-3 py-2 rounded-lg shadow pointer-events-auto"
                >
                    Review
                </button>
            </div>
        </div>
    )
}

// ---------------------- ImagesTab ----------------------
export function ImagesTab({ myProduct, competitors, onUpdateProduct, onUpdateCompetitor }: {
    myProduct: Product
    competitors: Product[]
    onUpdateProduct: (p: Product) => void
    onUpdateCompetitor: (id: string, updater: (p: Product) => Product) => void
}) {
    const selectedCompetitors = competitors.filter(c => c.selected)
    const allColumns = 1 + selectedCompetitors.length + 1 // +1 za fiksnu desnu kolonu

    const [commentsMap, setCommentsMap] = useState<Record<string, { id: string; text: string }[]>>({})
    const [newCommentText, setNewCommentText] = useState("")
    const [isDragging, setIsDragging] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 10 },
        })
    )

    React.useEffect(() => {
        if (isDragging) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = 'auto'
        return () => { document.body.style.overflow = 'auto' }
    }, [isDragging])

    const handleMyProductDragEnd = (event: any) => {
        const { active, over } = event
        setIsDragging(false)
        if (!over) return
        if (active.id !== over.id) {
            const oldIndex = myProduct.photos.findIndex(p => p === active.id)
            const newIndex = myProduct.photos.findIndex(p => p === over.id)
            if (oldIndex !== -1 && newIndex !== -1) {
                const newPhotos = arrayMove(myProduct.photos, oldIndex, newIndex)
                onUpdateProduct({ ...myProduct, photos: newPhotos })
            }
        }
    }

    const handleCompetitorDragEnd = (compId: string) => (event: any) => {
        const { active, over } = event
        setIsDragging(false)
        if (!over) return
        const comp = competitors.find(c => c.id === compId)
        if (!comp) return
        if (active.id !== over.id) {
            const oldIndex = comp.photos.findIndex(p => p === active.id)
            const newIndex = comp.photos.findIndex(p => p === over.id)
            if (oldIndex !== -1 && newIndex !== -1) {
                const newPhotos = arrayMove(comp.photos, oldIndex, newIndex)
                onUpdateCompetitor(compId, (p) => ({ ...p, photos: newPhotos }))
            }
        }
    }

    const handleDragStart = () => setIsDragging(true)
    const handleDragCancel = () => setIsDragging(false)

    const handleUpload = (productId: string, file: File) => {
        const reader = new FileReader()
        reader.onload = () => {
            const result = String(reader.result)
            if (productId === myProduct.id) onUpdateProduct({ ...myProduct, photos: [...myProduct.photos, result] })
            else onUpdateCompetitor(productId, (p) => ({ ...p, photos: [...p.photos, result] }))
        }
        reader.readAsDataURL(file)
    }

    function ColumnDropzone({ product, onDropFile }: { product: Product; onDropFile: (f: File) => void }) {
        const onDrop = useCallback((acceptedFiles: File[]) => { if (acceptedFiles.length) onDropFile(acceptedFiles[0]) }, [onDropFile])
        const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] } })

        return (
            <div {...getRootProps()} className="flex flex-col gap-3">
                <input {...getInputProps()} />
                <div className={`bg-slate-50 rounded-lg p-3 border border-slate-200 h-28 flex flex-col justify-between ${isDragActive ? 'ring-2 ring-emerald-300' : ''}`}>
                    <h3 className="font-semibold text-slate-900 text-sm">{product.id === myProduct.id ? 'Your Product' : product.name}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px]">{product.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{product.photos.length} images</p>
                </div>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={product.id === myProduct.id ? handleMyProductDragEnd : handleCompetitorDragEnd(product.id)}
                    onDragCancel={handleDragCancel}
                >
                    <SortableContext items={product.photos} strategy={rectSortingStrategy}>
                        <div className="grid gap-3">
                            {product.photos.map((photo) => (
                                <SortableImage key={photo} id={photo} src={photo} onOpenReview={() => { }} />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        )
    }

    const addComment = (imageId: string, text: string) => {
        setCommentsMap(prev => {
            const next = { ...prev }
            const arr = next[imageId] || []
            arr.push({ id: Math.random().toString(36).slice(2, 9), text })
            next[imageId] = arr
            return next
        })
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${allColumns}, minmax(0, 1fr))` }}>
                {/* My Product */}
                <ColumnDropzone product={myProduct} onDropFile={(f) => handleUpload(myProduct.id, f)} />

                {/* Selected Competitors */}
                {selectedCompetitors.map((comp) => (
                    <ColumnDropzone key={comp.id} product={comp} onDropFile={(f) => handleUpload(comp.id, f)} />
                ))}

                {/* Fiksna desna kolona za komentare */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col h-full">
                    <h3 className="font-semibold text-slate-900 mb-3">All Comments</h3>
                    <div className="flex-1 overflow-auto space-y-3 mb-3">
                        {Object.entries(commentsMap).flatMap(([imageId, comments]) =>
                            comments.map(c => (
                                <div key={c.id} className="p-2 rounded-lg border bg-white">
                                    <div className="text-sm text-slate-700">{c.text}</div>
                                    <div className="text-xs text-slate-400 mt-1">{imageId}</div>
                                </div>
                            ))
                        )}
                        {Object.keys(commentsMap).length === 0 && (
                            <div className="text-sm text-slate-500">No comments yet.</div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <textarea
                            className="w-full border rounded-md p-2 min-h-[60px]"
                            placeholder="Add a comment..."
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                        />
                        <button
                            className="px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                            onClick={() => {
                                if (!newCommentText.trim()) return
                                addComment('global', newCommentText.trim())
                                setNewCommentText('')
                            }}
                        >
                            Add Comment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ---------------------- Main Component ----------------------

export default function CompetitiveAnalysisPage({ params }: { params: { id: string } }) {
    // ID foldera za koji imamo mock data
    const MOCK_DATA_FOLDER_ID = "aa0b8211-47fd-4115-a917-c12ec7e10c34"

    // Provjeri da li je ovo folder sa mock podacima
    const hasMockData = params.id === MOCK_DATA_FOLDER_ID

    // Hardkodirani podaci - rade samo za specifican folder
    // Kasnije ces ovo povuci iz baze kada povezes Amazon API
    const [myProduct, setMyProduct] = useState<Product>(hasMockData ? myProductInit : {
        id: "my-1",
        name: "",
        price: 0,
        rating: 0,
        reviews: 0,
        photos: [],
    })
    const [competitors, setCompetitors] = useState<Product[]>(hasMockData ? competitorsInit : [])
    const [selectedTab, setSelectedTab] = useState<'overview' | 'images' | 'pricing' | 'content'>('overview')

    const toggleCompetitor = (id: string) => setCompetitors(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p))
    const selectedCompetitors = useMemo(() => competitors.filter(c => c.selected), [competitors])
    const updateCompetitor = (id: string, updater: (p: Product) => Product) => {
        setCompetitors(prev => prev.map(p => p.id === id ? updater(p) : p))
    }

    // Ako nema mock data, prikazi empty state
    if (!hasMockData) {
        return (
            <div className="min-h-screen overflow-hidden bg-linear-to-br from-slate-50 via-white to-slate-50 p-6">
                <div className="max-w-[1400px] mx-auto">
                    <header className="mb-6">
                        <div className="flex items-center gap-4 mb-4">
                            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <ArrowLeft className="h-5 w-5 text-slate-600" />
                            </button>
                            <div className="flex-1">
                                <h1 className="text-2xl font-semibold text-slate-900">Competitive Analysis</h1>
                            </div>
                        </div>
                    </header>

                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Package className="h-8 w-8 text-slate-400" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900 mb-2">No Competitive Analysis Yet</h2>
                            <p className="text-slate-600 mb-6">Start by adding competitors to analyze for this folder. Connect to Amazon API to fetch product data automatically.</p>
                            <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 mx-auto font-medium">
                                <Plus className="h-5 w-5" />Add First Competitor
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
                <header className="mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ArrowLeft className="h-5 w-5 text-slate-600" /></button>
                        <div className="flex-1">
                            <h1 className="text-2xl font-semibold text-slate-900">Eye Care Products - Competitive Analysis</h1>
                            <p className="text-sm text-slate-500 mt-1">Compare your product with {selectedCompetitors.length} competitors</p>
                        </div>
                        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 font-medium"><Plus className="h-4 w-4" />Add Competitor</button>
                    </div>

                    <div className="grid grid-cols-5 gap-3">
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg p-3 border border-emerald-200/50">
                            <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium text-emerald-700">Your Price</span><DollarSign className="h-3.5 w-3.5 text-emerald-600" /></div>
                            <p className="text-xl font-bold text-emerald-900">${myProduct.price}</p>
                            <p className="text-xs text-emerald-600 mt-0.5">vs avg $19.99</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-3 border border-blue-200/50">
                            <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium text-blue-700">Competitors</span><Package className="h-3.5 w-3.5 text-blue-600" /></div>
                            <p className="text-xl font-bold text-blue-900">{selectedCompetitors.length}</p>
                            <p className="text-xs text-blue-600 mt-0.5">selected for analysis</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-lg p-3 border border-amber-200/50">
                            <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium text-amber-700">Avg Rating</span><Star className="h-3.5 w-3.5 text-amber-600" /></div>
                            <p className="text-xl font-bold text-amber-900">4.5</p>
                            <p className="text-xs text-amber-600 mt-0.5">competitor average</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-3 border border-purple-200/50">
                            <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium text-purple-700">Images</span><FileImage className="h-3.5 w-3.5 text-purple-600" /></div>
                            <p className="text-xl font-bold text-purple-900">{myProduct.photos.length}</p>
                            <p className="text-xs text-purple-600 mt-0.5">vs avg 5.2 images</p>
                        </div>
                        <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-lg p-3 border border-rose-200/50">
                            <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium text-rose-700">Sponsored</span><Star className="h-3.5 w-3.5 text-rose-600" /></div>
                            <p className="text-xl font-bold text-rose-900">2</p>
                            <p className="text-xs text-rose-600 mt-0.5">ads running</p>
                        </div>
                    </div>
                </header>

                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-6 bg-white rounded-lg p-1 border border-slate-200 w-fit">
                        <button onClick={() => setSelectedTab('overview')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${selectedTab === 'overview' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>Overview</button>
                        <button onClick={() => setSelectedTab('images')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${selectedTab === 'images' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>Images</button>
                        <button onClick={() => setSelectedTab('pricing')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${selectedTab === 'pricing' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>Pricing</button>
                        <button onClick={() => setSelectedTab('content')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${selectedTab === 'content' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>Content</button>
                    </div>

                    {selectedTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <div className="bg-slate-50 border-b border-slate-200 p-4">
                                    <h2 className="font-semibold text-slate-900">Product Comparison</h2>
                                </div>
                                <div className="p-6">
                                    <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `repeat(${2 + selectedCompetitors.length}, minmax(0, 1fr))` }}>
                                        <div className="font-semibold text-slate-700">Metric</div>
                                        <div className="font-semibold text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 text-center">Your Product</div>
                                        {selectedCompetitors.map((comp, idx) => (
                                            <div key={comp.id} className="font-semibold text-slate-700 bg-slate-50 rounded-lg px-3 py-2 text-center text-sm">Competitor {idx + 1}</div>
                                        ))}
                                    </div>

                                    <ComparisonMetric label="Price" myValue={`$${myProduct.price}`} competitorValues={selectedCompetitors.map(c => `$${c.price}`)} />
                                    <ComparisonMetric label="Rating" myValue={myProduct.rating > 0 ? `${myProduct.rating} ⭐` : 'New Product'} competitorValues={selectedCompetitors.map(c => `${c.rating} ⭐`)} />
                                    <ComparisonMetric label="Reviews" myValue={myProduct.reviews.toLocaleString()} competitorValues={selectedCompetitors.map(c => c.reviews.toLocaleString())} />
                                    <ComparisonMetric label="Images" myValue={myProduct.photos.length} competitorValues={selectedCompetitors.map(c => c.photos.length)} />
                                    <ComparisonMetric label="Sponsored" myValue={myProduct.isSponsored ? '✓ Yes' : '✗ No'} competitorValues={selectedCompetitors.map(c => c.isSponsored ? '✓ Yes' : '✗ No')} />
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200">
                                <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
                                    <h2 className="font-semibold text-slate-900">All Competitors ({competitors.length})</h2>
                                    <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Find More</button>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {competitors.map((comp) => (
                                        <div
                                            key={comp.id}
                                            className={`p-4 hover:bg-slate-50 transition-colors ${comp.selected ? 'bg-emerald-50/30' : ''}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="checkbox"
                                                    checked={!!comp.selected}
                                                    onChange={() => toggleCompetitor(comp.id)}
                                                    className="w-5 h-5 rounded border-2 cursor-pointer accent-emerald-600"
                                                />
                                                <img src={comp.image} alt={comp.name} className="w-16 h-16 rounded-lg object-cover" />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold text-slate-900 text-sm">{comp.name}</h3>
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
                        </div>
                    )}

                    {selectedTab === 'images' && (
                        <ImagesTab myProduct={myProduct} competitors={competitors} onUpdateProduct={setMyProduct} onUpdateCompetitor={updateCompetitor} />
                    )}

                    {selectedTab === 'pricing' && (
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <div className="grid grid-cols-3 gap-6 mb-8">
                                <div className="text-center p-6 bg-emerald-50 rounded-xl border border-emerald-200">
                                    <p className="text-sm text-emerald-600 mb-2">Your Price</p>
                                    <p className="text-4xl font-bold text-emerald-900">${myProduct.price}</p>
                                </div>
                                <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
                                    <p className="text-sm text-blue-600 mb-2">Average Price</p>
                                    <p className="text-4xl font-bold text-blue-900">$19.99</p>
                                </div>
                                <div className="text-center p-6 bg-amber-50 rounded-xl border border-amber-200">
                                    <p className="text-sm text-amber-600 mb-2">Price Range</p>
                                    <p className="text-4xl font-bold text-amber-900">$16-$22</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                                    <div>
                                        <p className="font-semibold text-emerald-900">{myProduct.name}</p>
                                        <p className="text-sm text-emerald-600">Your Product</p>
                                    </div>
                                    <p className="text-2xl font-bold text-emerald-900">${myProduct.price}</p>
                                </div>
                                {selectedCompetitors.map((comp) => (
                                    <div key={comp.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <div>
                                            <p className="font-semibold text-slate-900">{comp.name}</p>
                                            <p className="text-sm text-slate-600">{comp.asin}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-slate-900">${comp.price}</p>
                                            <p className={`text-sm ${comp.price > myProduct.price ? 'text-red-600' : 'text-green-600'}`}>{comp.price > myProduct.price ? '+' : ''}{((comp.price - myProduct.price) / myProduct.price * 100).toFixed(1)}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedTab === 'content' && (
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <div className="mb-8">
                                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-slate-600" />Product Titles</h3>
                                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${1 + selectedCompetitors.length}, minmax(0, 1fr))` }}>
                                    <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                                        <div className="text-xs font-semibold text-emerald-700 mb-2">YOUR PRODUCT</div>
                                        <p className="text-sm text-slate-900 leading-relaxed mb-2">{myProduct.name}</p>
                                        <div className="text-xs text-emerald-600 font-medium">{myProduct.name.length} characters</div>
                                    </div>
                                    {selectedCompetitors.map((comp, idx) => (
                                        <div key={comp.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                            <div className="text-xs font-semibold text-slate-600 mb-2">COMPETITOR {idx + 1}</div>
                                            <p className="text-sm text-slate-900 leading-relaxed mb-2">{comp.name}</p>
                                            <div className="text-xs text-slate-500 font-medium">{comp.name.length} characters{comp.name.length !== myProduct.name.length && (<span className={comp.name.length > myProduct.name.length ? 'text-amber-600' : 'text-green-600'}>{' • '}{comp.name.length > myProduct.name.length ? '+' : ''}{comp.name.length - myProduct.name.length}</span>)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-slate-600" />Product Descriptions</h3>
                                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${1 + selectedCompetitors.length}, minmax(0, 1fr))` }}>
                                    <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                                        <div className="text-xs font-semibold text-emerald-700 mb-2">YOUR PRODUCT</div>
                                        <p className="text-sm text-slate-700 leading-relaxed">{myProduct.description}</p>
                                    </div>
                                    {selectedCompetitors.map((comp, idx) => (
                                        <div key={comp.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                            <div className="text-xs font-semibold text-slate-600 mb-2">COMPETITOR {idx + 1}</div>
                                            <p className="text-sm text-slate-700 leading-relaxed">{comp.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-slate-600" />Key Features / Bullet Points</h3>
                                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${1 + selectedCompetitors.length}, minmax(0, 1fr))` }}>
                                    <div className="space-y-2">
                                        <div className="text-xs font-semibold text-emerald-700 mb-3 bg-emerald-50 border-2 border-emerald-200 rounded-lg p-2">YOUR PRODUCT ({myProduct.bulletPoints?.length ?? 0} points)</div>
                                        {(myProduct.bulletPoints || []).map((point, idx) => (
                                            <div key={idx} className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{idx + 1}</div>
                                                <span className="text-sm text-slate-700 leading-relaxed">{point}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {selectedCompetitors.map((comp, compIdx) => (
                                        <div key={comp.id} className="space-y-2">
                                            <div className="text-xs font-semibold text-slate-600 mb-3 bg-slate-50 border border-slate-200 rounded-lg p-2">COMPETITOR {compIdx + 1} ({comp.bulletPoints?.length ?? 0} points)</div>
                                            {(comp.bulletPoints || []).map((point, idx) => (
                                                <div key={idx} className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                                                    <div className="w-5 h-5 rounded-full bg-slate-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{idx + 1}</div>
                                                    <span className="text-sm text-slate-700 leading-relaxed">{point}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}