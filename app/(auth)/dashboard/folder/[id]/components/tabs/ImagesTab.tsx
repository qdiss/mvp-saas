"use client";

import React, { useState, useCallback, useEffect } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useDropzone } from "react-dropzone";
import {
  Plus,
  Loader2,
  X,
  ZoomIn,
  Download,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { Product, Comment } from "@/types";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { SortableImage } from "../SortableImage";
import { CommentsColumn } from "./CommentColumns";

type ImagesTabProps = {
  myProduct: Product;
  competitors: Product[];
  onUpdateProduct: (p: Product) => void;
  onUpdateCompetitor: (id: string, updater: (p: Product) => Product) => void;
  comparisonId?: string; // ✅ Dodaj kao prop
};

type PhotoMetadata = {
  url: string;
  isNew?: boolean;
  addedAt?: number;
  loading?: boolean;
  error?: boolean;
};

export function ImagesTab({
  myProduct,
  competitors,
  onUpdateProduct,
  onUpdateCompetitor,
  comparisonId,
}: ImagesTabProps) {
  const selectedCompetitors = competitors.filter((c) => c.selected);
  const allColumns = 1 + selectedCompetitors.length + 1;

  const [comments, setComments] = useState<Comment[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [photoMetadata, setPhotoMetadata] = useState<
    Record<string, PhotoMetadata>
  >({});
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [savingComment, setSavingComment] = useState(false);

  const {
    sensors,
    handleMyProductDragEnd,
    handleCompetitorDragEnd,
    handleDragStart,
    handleDragCancel,
  } = useDragAndDrop(
    myProduct,
    competitors,
    onUpdateProduct,
    onUpdateCompetitor
  );

  // Initialize photo metadata for existing photos from database
  useEffect(() => {
    const allProducts = [myProduct, ...competitors];
    const metadata: Record<string, PhotoMetadata> = {};

    allProducts.forEach((product) => {
      product.photos.forEach((photoUrl) => {
        if (!photoMetadata[photoUrl]) {
          metadata[photoUrl] = {
            url: photoUrl,
            isNew: false,
            addedAt: Date.now(),
            loading: false,
            error: false,
          };
        }
      });
    });

    if (Object.keys(metadata).length > 0) {
      setPhotoMetadata((prev) => ({ ...prev, ...metadata }));
    }
  }, [myProduct.asin, competitors.length]); // ✅ FIX: Only re-run when ASIN or competitor count changes

  // Load comments from database
  useEffect(() => {
    if (comparisonId) {
      // ✅ Koristi prop, ne myProduct.comparisonId
      loadComments();
    }
  }, [comparisonId]);

  const loadComments = async () => {
    if (loadingComments || !comparisonId) return;

    setLoadingComments(true);
    try {
      const response = await fetch(
        `/api/comments/image?comparisonId=${comparisonId}`
      );
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("[COMMENTS] Failed to load:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleUpload = (productId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      const photoId = `photo-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;

      setPhotoMetadata((prev) => ({
        ...prev,
        [photoId]: {
          url: result,
          isNew: true,
          addedAt: Date.now(),
          loading: false,
          error: false,
        },
      }));

      if (productId === myProduct.id) {
        onUpdateProduct({
          ...myProduct,
          photos: [...myProduct.photos, photoId],
        });
      } else {
        onUpdateCompetitor(productId, (p) => ({
          ...p,
          photos: [...p.photos, photoId],
        }));
      }
    };
    reader.onerror = () => {
      alert("Failed to upload image");
    };
    reader.readAsDataURL(file);
  };

  const toggleImageSelection = (imageId: string) => {
    setSelectedImageIds((prev) => {
      if (prev.includes(imageId)) {
        return prev.filter((id) => id !== imageId);
      } else {
        return [...prev, imageId];
      }
    });
  };

  const addComment = async (text: string) => {
    if (selectedImageIds.length === 0 || !text.trim() || !comparisonId) return;

    setSavingComment(true);
    try {
      const imageUrls = selectedImageIds.map((id) => getPhotoUrl(id));

      const response = await fetch("/api/comments/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrls: imageUrls,
          content: text.trim(),
          comparisonId: comparisonId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadComments();
        setNewCommentText("");
        setSelectedImageIds([]);
      }
    } catch (error) {
      console.error("[COMMENT] Failed:", error);
      alert("Failed to save comment");
    } finally {
      setSavingComment(false);
    }
  };

  const toggleCommentStatus = async (
    commentId: string,
    newStatus: "open" | "resolved" | "archived"
  ) => {
    try {
      const response = await fetch(`/api/comments/image?id=${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        await loadComments();
        setOpenMenuId(null);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;

    try {
      await fetch(`/api/comments/image?id=${commentId}`, { method: "DELETE" });
      await loadComments();
      setOpenMenuId(null);
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const getPhotoUrl = (photoId: string): string => {
    return photoMetadata[photoId]?.url || photoId;
  };

  const isNewPhoto = (photoId: string): boolean => {
    return photoMetadata[photoId]?.isNew || false;
  };

  const getCommentCount = (photoId: string): number => {
    const photoUrl = getPhotoUrl(photoId);
    return comments.filter((c) => c.images.includes(photoUrl)).length;
  };

  const handleImageError = (photoId: string) => {
    setPhotoMetadata((prev) => ({
      ...prev,
      [photoId]: {
        ...prev[photoId],
        error: true,
        loading: false,
      },
    }));
  };

  const handleImageLoad = (photoId: string) => {
    setPhotoMetadata((prev) => ({
      ...prev,
      [photoId]: {
        ...prev[photoId],
        loading: false,
        error: false,
      },
    }));
  };

  const downloadImage = (photoId: string) => {
    const url = getPhotoUrl(photoId);
    const link = document.createElement("a");
    link.href = url;
    link.download = `product-image-${photoId}.jpg`;
    link.click();
  };

  return (
    <>
      <div className="rounded-xl border border-slate-200 p-6 max">
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${
              allColumns - 1
            }, minmax(0, 1fr)) 280px`,
          }}
        >
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
            onImageError={handleImageError}
            onImageLoad={handleImageLoad}
            onFullscreen={setFullscreenImage}
            photoMetadata={photoMetadata}
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
              onImageError={handleImageError}
              onImageLoad={handleImageLoad}
              onFullscreen={setFullscreenImage}
              photoMetadata={photoMetadata}
            />
          ))}

          {/* Comments Column */}
          <CommentsColumn
            comments={comments}
            newCommentText={newCommentText}
            setNewCommentText={setNewCommentText}
            addComment={addComment}
            deleteComment={deleteComment}
            toggleStatus={toggleCommentStatus}
            selectedImageIds={selectedImageIds}
            getPhotoUrl={getPhotoUrl}
            onClearSelection={() => setSelectedImageIds([])}
            loadingComments={loadingComments}
            savingComment={savingComment}
          />
        </div>
      </div>

      {fullscreenImage && (
        <FullscreenModal
          imageUrl={getPhotoUrl(fullscreenImage)}
          onClose={() => setFullscreenImage(null)}
          comments={comments.filter((c) =>
            c.images.includes(getPhotoUrl(fullscreenImage))
          )} // ✅ NOVA LOGIKA
        />
      )}
    </>
  );
}

// Product Column Component (updated)
type ProductColumnProps = {
  product: Product;
  isMyProduct: boolean;
  sensors: any;
  onDragStart: () => void;
  onDragEnd: (event: any) => void;
  onDragCancel: () => void;
  onUpload: (productId: string, file: File) => void;
  getPhotoUrl: (photoId: string) => string;
  isNewPhoto: (photoId: string) => boolean;
  getCommentCount: (photoId: string) => number;
  selectedImageIds: string[];
  onToggleImageSelection: (id: string) => void;
  onImageError: (photoId: string) => void;
  onImageLoad: (photoId: string) => void;
  onFullscreen: (photoId: string) => void;
  photoMetadata: Record<string, PhotoMetadata>;
};

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
  onToggleImageSelection,
  onImageError,
  onImageLoad,
  onFullscreen,
  photoMetadata,
}: ProductColumnProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length) onUpload(product.id, acceptedFiles[0]);
    },
    [product.id, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    noClick: true,
    noKeyboard: true,
  });

  const bgColor = isMyProduct
    ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50"
    : "bg-slate-50";

  const borderColor = isMyProduct ? "border-emerald-200" : "border-slate-200";

  const textColor = isMyProduct ? "text-emerald-900" : "text-slate-900";

  const subTextColor = isMyProduct ? "text-emerald-700" : "text-slate-600";

  const countColor = isMyProduct ? "text-emerald-600" : "text-slate-500";

  return (
    <div className="flex flex-col gap-3">
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <div
          className={`${bgColor} rounded-lg p-3 border-2 ${borderColor} h-28 flex flex-col justify-between ${
            isDragActive ? "ring-2 ring-emerald-400" : ""
          }`}
        >
          <h3 className={`font-semibold ${textColor} text-sm line-clamp-1`}>
            {isMyProduct ? "Your Product" : product.name}
          </h3>
          <p className={`text-xs ${subTextColor} line-clamp-2 min-h-8`}>
            {product.name}
          </p>
          <div className="flex items-center justify-between">
            <p className={`text-xs ${countColor} font-medium`}>
              {product.photos.length} images
            </p>
            {selectedImageIds.filter((id) => product.photos.includes(id))
              .length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {
                  selectedImageIds.filter((id) => product.photos.includes(id))
                    .length
                }{" "}
                selected
              </span>
            )}
          </div>
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
            {product.photos.map((photoId) => {
              const meta = photoMetadata[photoId];

              return (
                <div key={photoId} className="relative">
                  <SortableImage
                    id={photoId}
                    src={getPhotoUrl(photoId)}
                    isMyProduct={isMyProduct}
                    isNew={isNewPhoto(photoId)}
                    isSelected={selectedImageIds.includes(photoId)}
                    commentCount={getCommentCount(photoId)}
                    onSelect={() => onToggleImageSelection(photoId)}
                    onOpenReview={() => {}}
                    onError={() => onImageError(photoId)}
                    onLoad={() => onImageLoad(photoId)}
                  />

                  {/* Loading/Error States */}
                  {meta?.loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 rounded-lg pointer-events-none">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  )}
                  {meta?.error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-50/80 rounded-lg pointer-events-none">
                      <div className="text-center p-2">
                        <X className="h-6 w-6 text-red-400 mx-auto mb-1" />
                        <p className="text-xs text-red-600">Failed to load</p>
                      </div>
                    </div>
                  )}

                  {/* Fullscreen button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFullscreen(photoId);
                    }}
                    className="absolute top-1 left-1 p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    title="View fullscreen"
                  >
                    <ZoomIn className="h-3 w-3" />
                  </button>
                </div>
              );
            })}

            {/* Add New Image Button */}
            <button
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) onUpload(product.id, file);
                };
                input.click();
              }}
              className={`aspect-square rounded-lg border-2 border-dashed ${
                isMyProduct
                  ? "border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50/50"
                  : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
              } transition-all flex items-center justify-center group`}
            >
              <div className="text-center">
                <Plus
                  className={`h-8 w-8 mx-auto mb-1 ${
                    isMyProduct
                      ? "text-emerald-400 group-hover:text-emerald-500"
                      : "text-slate-400 group-hover:text-slate-500"
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    isMyProduct ? "text-emerald-600" : "text-slate-600"
                  }`}
                >
                  Add Image
                </span>
              </div>
            </button>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// Fullscreen Modal Component (simplified)
function FullscreenModal({
  imageUrl,
  onClose,
  comments,
}: {
  imageUrl: string;
  onClose: () => void;
  comments: Comment[];
}) {
  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-slate-300 transition-colors p-2 bg-white/10 rounded-lg"
      >
        <X className="h-6 w-6" />
      </button>

      <div
        className="max-w-7xl max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Fullscreen"
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
        />

        {comments.length > 0 && (
          <div className="mt-4 bg-white/90 rounded-lg p-4 max-w-md">
            <h4 className="font-semibold mb-2">Comments ({comments.length})</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="text-sm text-slate-700 p-2 bg-slate-50 rounded"
                >
                  <p className="font-semibold text-xs text-slate-500 mb-1">
                    {c.createdBy}
                  </p>
                  <p>{c.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
