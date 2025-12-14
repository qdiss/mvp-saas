// components/SortableImage.tsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MessageCircle, Sparkles } from "lucide-react";
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

  // Handle click for selection (separate from drag)
  const handleClick = (e: React.MouseEvent) => {
    // Only handle selection if not dragging
    if (!isDragging && onSelect) {
      e.stopPropagation();
      onSelect();
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        onClick={handleClick}
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

        {/* Selection Overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              ✓
            </div>
          </div>
        )}
      </div>

      {/* Drag Handle - shows on hover */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 right-1 w-6 h-6 bg-white/90 rounded border border-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing flex items-center justify-center"
        title="Drag to reorder"
      >
        <svg
          className="w-3 h-3 text-slate-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
        </svg>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute bottom-1 right-1 px-2 py-0.5 bg-blue-500 text-white rounded text-xs font-medium pointer-events-none">
          Selected
        </div>
      )}
    </div>
  );
}
