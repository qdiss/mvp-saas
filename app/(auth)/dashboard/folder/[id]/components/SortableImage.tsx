// components/SortableImage.tsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  MessageCircle,
  Sparkles,
  Download,
  ZoomIn,
  MoreVertical,
} from "lucide-react";
import { useState } from "react";

type SortableImageProps = {
  id: string;
  src: string;
  isMyProduct: boolean;
  isNew?: boolean;
  isSelected?: boolean;
  commentCount?: number;
  onSelect?: () => void;
  onOpenReview?: () => void;
  onError?: () => void;
  onLoad?: () => void;
  onFullscreen?: () => void; // ✅ NEW: Open fullscreen
};

export function SortableImage({
  id,
  src,
  isMyProduct,
  isNew,
  isSelected,
  commentCount = 0,
  onSelect,
  onOpenReview,
  onError,
  onLoad,
  onFullscreen,
}: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const [imageError, setImageError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  const handleLoad = () => {
    setImageError(false);
    onLoad?.();
  };

  // ✅ Click on image = open fullscreen
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging && onFullscreen) {
      onFullscreen();
    }
  };

  // ✅ Download image via proxy
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);

    try {
      // Use proxy endpoint to download cross-origin images
      const response = await fetch("/api/images/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: src }),
      });

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `product-image-${id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("[DOWNLOAD] Failed:", error);
      alert("Failed to download image");
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
          isDragging ? "cursor-grabbing" : "cursor-pointer"
        } ${
          isSelected
            ? "border-blue-500 ring-2 ring-blue-200"
            : isMyProduct
            ? "border-emerald-200 hover:border-emerald-300"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
            <div className="text-center">
              <span className="text-2xl">📷</span>
              <p className="text-xs mt-1">Image not available</p>
            </div>
          </div>
        ) : (
          <img
            src={src}
            alt="Product"
            className="w-full h-full object-cover"
            onError={handleError}
            onLoad={handleLoad}
            loading="lazy"
            onClick={handleImageClick} // ✅ Click to fullscreen
          />
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1 pointer-events-none">
          {isNew && (
            <div className="px-2 py-0.5 bg-blue-500 text-white rounded-full text-xs font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              New
            </div>
          )}
          {commentCount > 0 && (
            <div className="px-2 py-0.5 bg-slate-900/80 text-white rounded-full text-xs font-medium flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {commentCount}
            </div>
          )}
        </div>

        {/* ✅ NEW: Click to Select Indicator (top-left) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
          className={`absolute top-2 left-2 w-6 h-6 rounded border-2 transition-all ${
            isSelected
              ? "bg-blue-500 border-blue-500"
              : "bg-white/90 border-slate-300 hover:border-blue-400"
          } flex items-center justify-center opacity-0 group-hover:opacity-100`}
          title="Select image for commenting"
        >
          {isSelected && (
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {/* ✅ NEW: Fullscreen Icon (shows on hover) */}
        <button
          onClick={handleImageClick}
          className="absolute top-2 right-10 p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          title="View fullscreen"
        >
          <ZoomIn className="h-3.5 w-3.5 text-slate-700" />
        </button>

        {/* ✅ NEW: Three Dots Menu (top-right) */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm"
            title="Options"
          >
            <MoreVertical className="h-3.5 w-3.5 text-slate-700" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />

              {/* Menu */}
              <div className="absolute top-8 right-0 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                <button
                  onClick={handleDownload}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                >
                  <Download className="h-4 w-4 text-slate-500" />
                  Download
                </button>
              </div>
            </>
          )}
        </div>

        {/* Selection Overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-blue-500/20 pointer-events-none" />
        )}
      </div>

      {/* Drag Handle - shows on hover (bottom-right) */}
      <div
        {...attributes}
        {...listeners}
        className="absolute bottom-2 right-2 w-7 h-7 bg-white/90 rounded-lg border border-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing flex items-center justify-center shadow-sm"
        title="Drag to reorder"
      >
        <svg
          className="w-4 h-4 text-slate-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
        </svg>
      </div>
    </div>
  );
}
