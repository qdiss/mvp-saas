"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Sparkles, MessageCircle } from "lucide-react"

type SortableImageProps = {
    id: string
    src: string
    isMyProduct: boolean
    isNew?: boolean
    isSelected?: boolean
    commentCount?: number
    onSelect?: () => void
    onOpenReview: (id: string) => void
}

export function SortableImage({ 
    id, 
    src, 
    isMyProduct, 
    isNew = false,
    isSelected = false,
    commentCount = 0,
    onSelect,
    onOpenReview 
}: SortableImageProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 999 : 'auto',
    }

    // Border colors based on state
    let borderColor = 'border-slate-200'
    let hoverBorderColor = 'hover:border-slate-300'
    let bgGradient = ''
    
    if (isSelected) {
        borderColor = 'border-blue-400 ring-2 ring-blue-300'
        hoverBorderColor = 'hover:border-blue-500'
    } else if (isNew && isMyProduct) {
        borderColor = 'border-emerald-400'
        hoverBorderColor = 'hover:border-emerald-500'
        bgGradient = 'bg-gradient-to-br from-emerald-100/60 to-emerald-200/40'
    } else if (isMyProduct) {
        borderColor = 'border-emerald-300'
        hoverBorderColor = 'hover:border-emerald-400'
    }

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...listeners} 
            className="relative group cursor-move"
            onClick={(e) => {
                // Allow selection when clicking on the image (not dragging)
                if (!isDragging && onSelect) {
                    e.stopPropagation()
                    onSelect()
                }
            }}
        >
            {/* New Badge */}
            {isNew && isMyProduct && (
                <div className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-0.5 animate-pulse">
                    <Sparkles className="h-2.5 w-2.5" />
                    NEW
                </div>
            )}

            {/* Comment Count Badge */}
            {commentCount > 0 && (
                <div className={`absolute -top-2 -left-2 z-10 ${
                    isSelected ? 'bg-blue-500' : 'bg-slate-600'
                } text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1`}>
                    <MessageCircle className="h-2.5 w-2.5" />
                    {commentCount}
                </div>
            )}

            {/* Selected Checkmark */}
            {isSelected && (
                <div className="absolute top-1 right-1 z-10 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}

            <div className={`aspect-square rounded-lg overflow-hidden border-2 ${borderColor} ${hoverBorderColor} ${bgGradient} transition-all`}>
                <img src={src} alt={id} className="w-full h-full object-cover" />
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black/10 rounded-lg">
                <div className="flex flex-col gap-1.5 pointer-events-auto">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            if (onSelect) onSelect()
                        }}
                        className={`${
                            isSelected
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : isMyProduct 
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                    : 'bg-white hover:bg-slate-50 text-slate-900'
                        } px-3 py-1.5 rounded-lg shadow-lg text-xs font-medium transition-colors`}
                    >
                        {isSelected ? '✓ Selected' : 'Select'}
                    </button>
                </div>
            </div>
        </div>
    )
}