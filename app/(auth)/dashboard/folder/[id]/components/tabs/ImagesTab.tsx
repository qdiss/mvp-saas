"use client"

import React, { useState, useCallback } from "react"
import { DndContext, closestCenter } from "@dnd-kit/core"
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable"
import { useDropzone } from "react-dropzone"
import { Plus, MessageCircle } from "lucide-react"
import { Product, Comment } from "@/types"
import { useDragAndDrop } from "@/hooks/useDragAndDrop"
import { SortableImage } from "../SortableImage"

type ImagesTabProps = {
    myProduct: Product
    competitors: Product[]
    onUpdateProduct: (p: Product) => void
    onUpdateCompetitor: (id: string, updater: (p: Product) => Product) => void
}

type PhotoMetadata = {
    url: string
    isNew?: boolean
    addedAt?: number
}

export function ImagesTab({ myProduct, competitors, onUpdateProduct, onUpdateCompetitor }: ImagesTabProps) {
    const selectedCompetitors = competitors.filter(c => c.selected)
    const allColumns = 1 + selectedCompetitors.length + 1

    const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({})
    const [newCommentText, setNewCommentText] = useState("")
    const [selectedImageIds, setSelectedImageIds] = useState<string[]>([])
    const [photoMetadata, setPhotoMetadata] = useState<Record<string, PhotoMetadata>>({})

    const {
        sensors,
        handleMyProductDragEnd,
        handleCompetitorDragEnd,
        handleDragStart,
        handleDragCancel,
    } = useDragAndDrop(myProduct, competitors, onUpdateProduct, onUpdateCompetitor)

    const handleUpload = (productId: string, file: File) => {
        const reader = new FileReader()
        reader.onload = () => {
            const result = String(reader.result)
            const photoId = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
            
            setPhotoMetadata(prev => ({
                ...prev,
                [photoId]: {
                    url: result,
                    isNew: true,
                    addedAt: Date.now()
                }
            }))

            if (productId === myProduct.id) {
                onUpdateProduct({ ...myProduct, photos: [...myProduct.photos, photoId] })
            } else {
                onUpdateCompetitor(productId, (p) => ({ ...p, photos: [...p.photos, photoId] }))
            }
        }
        reader.readAsDataURL(file)
    }

    const toggleImageSelection = (imageId: string) => {
        setSelectedImageIds(prev => {
            if (prev.includes(imageId)) {
                return prev.filter(id => id !== imageId)
            } else {
                return [...prev, imageId]
            }
        })
    }

    const addComment = (text: string) => {
        if (selectedImageIds.length === 0 || !text.trim()) return
        
        setCommentsMap(prev => {
            const next = { ...prev }
            selectedImageIds.forEach(imageId => {
                const arr = next[imageId] || []
                arr.push({
                    id: Math.random().toString(36).slice(2, 9),
                    text: text.trim(),
                    imageId
                })
                next[imageId] = arr
            })
            return next
        })
        setNewCommentText('')
    }

    const deleteComment = (commentId: string, imageId: string) => {
        setCommentsMap(prev => {
            const next = { ...prev }
            if (next[imageId]) {
                next[imageId] = next[imageId].filter(c => c.id !== commentId)
                if (next[imageId].length === 0) {
                    delete next[imageId]
                }
            }
            return next
        })
    }

    const getPhotoUrl = (photoId: string): string => {
        return photoMetadata[photoId]?.url || photoId
    }

    const isNewPhoto = (photoId: string): boolean => {
        return photoMetadata[photoId]?.isNew || false
    }

    const getCommentCount = (photoId: string): number => {
        return commentsMap[photoId]?.length || 0
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${allColumns - 1}, minmax(0, 1fr)) 280px` }}>
                {/* My Product */}
                <ProductColumn
                    product={myProduct}
                    isMyProduct={true}
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleMyProductDragEnd}
                    onDragCancel={handleDragCancel}
                    onUpload={handleUpload}
                    getPhotoUrl={getPhotoUrl}
                    isNewPhoto={isNewPhoto}
                    getCommentCount={getCommentCount}
                    selectedImageIds={selectedImageIds}
                    onToggleImageSelection={toggleImageSelection}
                />

                {/* Selected Competitors */}
                {selectedCompetitors.map((comp) => (
                    <ProductColumn
                        key={comp.id}
                        product={comp}
                        isMyProduct={false}
                        sensors={sensors}
                        onDragStart={handleDragStart}
                        onDragEnd={handleCompetitorDragEnd(comp.id)}
                        onDragCancel={handleDragCancel}
                        onUpload={handleUpload}
                        getPhotoUrl={getPhotoUrl}
                        isNewPhoto={isNewPhoto}
                        getCommentCount={getCommentCount}
                        selectedImageIds={selectedImageIds}
                        onToggleImageSelection={toggleImageSelection}
                    />
                ))}

                {/* Comments Column */}
                <CommentsColumn
                    commentsMap={commentsMap}
                    newCommentText={newCommentText}
                    setNewCommentText={setNewCommentText}
                    addComment={addComment}
                    deleteComment={deleteComment}
                    selectedImageIds={selectedImageIds}
                    getPhotoUrl={getPhotoUrl}
                    onClearSelection={() => setSelectedImageIds([])}
                />
            </div>
        </div>
    )
}

// Product Column Component
type ProductColumnProps = {
    product: Product
    isMyProduct: boolean
    sensors: any
    onDragStart: () => void
    onDragEnd: (event: any) => void
    onDragCancel: () => void
    onUpload: (productId: string, file: File) => void
    getPhotoUrl: (photoId: string) => string
    isNewPhoto: (photoId: string) => boolean
    getCommentCount: (photoId: string) => number
    selectedImageIds: string[]
    onToggleImageSelection: (id: string) => void
}

function ProductColumn({ 
    product, 
    isMyProduct, 
    sensors, 
    onDragStart, 
    onDragEnd, 
    onDragCancel, 
    onUpload,
    getPhotoUrl,
    isNewPhoto,
    getCommentCount,
    selectedImageIds,
    onToggleImageSelection
}: ProductColumnProps) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length) onUpload(product.id, acceptedFiles[0])
    }, [product.id, onUpload])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [] },
        noClick: true,
        noKeyboard: true
    })

    const bgColor = isMyProduct
        ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50'
        : 'bg-slate-50'

    const borderColor = isMyProduct
        ? 'border-emerald-200'
        : 'border-slate-200'

    const textColor = isMyProduct
        ? 'text-emerald-900'
        : 'text-slate-900'

    const subTextColor = isMyProduct
        ? 'text-emerald-700'
        : 'text-slate-600'

    const countColor = isMyProduct
        ? 'text-emerald-600'
        : 'text-slate-500'

    return (
        <div className="flex flex-col gap-3">
            <div {...getRootProps()}>
                <input {...getInputProps()} />
                <div className={`${bgColor} rounded-lg p-3 border-2 ${borderColor} h-28 flex flex-col justify-between ${isDragActive ? 'ring-2 ring-emerald-400' : ''}`}>
                    <h3 className={`font-semibold ${textColor} text-sm`}>
                        {isMyProduct ? 'Your Product' : product.name}
                    </h3>
                    <p className={`text-xs ${subTextColor} line-clamp-2 min-h-8`}>
                        {product.name}
                    </p>
                    <p className={`text-xs ${countColor} font-medium`}>
                        {product.photos.length} images
                    </p>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragCancel={onDragCancel}
            >
                <SortableContext items={product.photos} strategy={rectSortingStrategy}>
                    <div className="grid gap-3">
                        {product.photos.map((photoId) => (
                            <SortableImage
                                key={photoId}
                                id={photoId}
                                src={getPhotoUrl(photoId)}
                                isMyProduct={isMyProduct}
                                isNew={isNewPhoto(photoId)}
                                isSelected={selectedImageIds.includes(photoId)}
                                commentCount={getCommentCount(photoId)}
                                onSelect={() => onToggleImageSelection(photoId)}
                                onOpenReview={() => {}}
                            />
                        ))}
                        
                        {/* Add New Image Button */}
                        <button
                            onClick={() => {
                                const input = document.createElement('input')
                                input.type = 'file'
                                input.accept = 'image/*'
                                input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0]
                                    if (file) onUpload(product.id, file)
                                }
                                input.click()
                            }}
                            className={`aspect-square rounded-lg border-2 border-dashed ${
                                isMyProduct 
                                    ? 'border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50/50' 
                                    : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                            } transition-all flex items-center justify-center group`}
                        >
                            <div className="text-center">
                                <Plus className={`h-8 w-8 mx-auto mb-1 ${
                                    isMyProduct ? 'text-emerald-400 group-hover:text-emerald-500' : 'text-slate-400 group-hover:text-slate-500'
                                }`} />
                                <span className={`text-xs font-medium ${
                                    isMyProduct ? 'text-emerald-600' : 'text-slate-600'
                                }`}>Add Image</span>
                            </div>
                        </button>
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    )
}

// Comments Column Component
type CommentsColumnProps = {
    commentsMap: Record<string, Comment[]>
    newCommentText: string
    setNewCommentText: (text: string) => void
    addComment: (text: string) => void
    deleteComment: (commentId: string, imageId: string) => void
    selectedImageIds: string[]
    getPhotoUrl: (photoId: string) => string
    onClearSelection: () => void
}

function CommentsColumn({ 
    commentsMap, 
    newCommentText, 
    setNewCommentText, 
    addComment, 
    deleteComment,
    selectedImageIds,
    getPhotoUrl,
    onClearSelection
}: CommentsColumnProps) {
    const selectedImagesComments = selectedImageIds.flatMap(imageId => 
        (commentsMap[imageId] || []).map(c => ({ ...c, imageId }))
    )

    const allComments = Object.entries(commentsMap).flatMap(([imageId, comments]) => 
        comments.map(c => ({ ...c, imageId }))
    )

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900 text-sm">
                    {selectedImageIds.length > 0 ? `Comments (${selectedImageIds.length} selected)` : 'All Comments'}
                </h3>
                {selectedImageIds.length > 0 && (
                    <button
                        onClick={onClearSelection}
                        className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                    >
                        Clear
                    </button>
                )}
            </div>
            
            {/* Selected Images Preview */}
            {selectedImageIds.length > 0 && (
                <div className="mb-3 flex gap-1 flex-wrap">
                    {selectedImageIds.map(imageId => (
                        <div key={imageId} className="relative group">
                            <img 
                                src={getPhotoUrl(imageId)} 
                                alt="Selected" 
                                className="w-12 h-12 object-cover rounded border-2 border-blue-300"
                            />
                            <button
                                onClick={() => onClearSelection()}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex-1 overflow-auto space-y-2 mb-3 min-h-[150px] max-h-[400px]">
                {selectedImageIds.length > 0 ? (
                    selectedImagesComments.length === 0 ? (
                        <div className="text-xs text-slate-500">No comments for selected images yet.</div>
                    ) : (
                        selectedImagesComments.map(comment => (
                            <div key={comment.id} className="p-2 rounded-lg border bg-white group relative">
                                <div className="text-xs text-slate-700 mb-1 pr-12">{comment.text}</div>
                                <div className="flex items-center gap-1">
                                    <img 
                                        src={getPhotoUrl(comment.imageId)} 
                                        alt="Thumbnail" 
                                        className="w-6 h-6 object-cover rounded"
                                    />
                                </div>
                                <button
                                    onClick={() => deleteComment(comment.id, comment.imageId)}
                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-xs font-medium transition-opacity"
                                >
                                    ×
                                </button>
                            </div>
                        ))
                    )
                ) : (
                    allComments.length === 0 ? (
                        <div className="text-xs text-slate-500">No comments yet. Select images to add comments.</div>
                    ) : (
                        allComments.map(comment => (
                            <div key={comment.id} className="p-2 rounded-lg border bg-white">
                                <div className="text-xs text-slate-700 mb-1">{comment.text}</div>
                                <div className="flex items-center gap-1">
                                    <img 
                                        src={getPhotoUrl(comment.imageId)} 
                                        alt="Thumbnail" 
                                        className="w-6 h-6 object-cover rounded"
                                    />
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>

            {/* Add Comment Form */}
            <div className="flex flex-col gap-2">
                {selectedImageIds.length > 0 && (
                    <div className="text-xs text-emerald-600 font-medium">
                        💬 Comment for {selectedImageIds.length} image{selectedImageIds.length > 1 ? 's' : ''}
                    </div>
                )}
                <textarea
                    className="w-full border rounded-md p-2 min-h-[50px] text-xs"
                    placeholder={selectedImageIds.length > 0 ? "Add comment to selected images..." : "Select images first"}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    disabled={selectedImageIds.length === 0}
                />
                <button
                    className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                        selectedImageIds.length > 0 
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                    onClick={() => addComment(newCommentText)}
                    disabled={selectedImageIds.length === 0 || !newCommentText.trim()}
                >
                    {selectedImageIds.length > 0 ? 'Add Comment' : 'Select Images'}
                </button>
            </div>
        </div>
    )
}