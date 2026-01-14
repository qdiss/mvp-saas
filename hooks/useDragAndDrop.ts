// hooks/useDragAndDrop.ts
// ✅ FIXED: Auto-save image order to database when drag ends

import { useState, useEffect } from "react";
import {
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Product } from "../types";

export function useDragAndDrop(
  myProduct: Product,
  competitors: Product[],
  onUpdateProduct: (p: Product) => void,
  onUpdateCompetitor: (id: string, updater: (p: Product) => Product) => void
) {
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    })
  );

  useEffect(() => {
    if (isDragging) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isDragging]);

  // ✅ NEW: Auto-save image order to database
  const saveImageOrder = async (asin: string, imageUrls: string[]) => {
    try {
      console.log(`[IMAGE ORDER] Saving for ${asin}:`, imageUrls);

      const response = await fetch(`/api/products/${asin}/images/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls }),
      });

      if (!response.ok) {
        throw new Error("Failed to save image order");
      }

      console.log(`[IMAGE ORDER] ✅ Saved for ${asin}`);
    } catch (error) {
      console.error("[IMAGE ORDER] ❌ Failed to save:", error);
      // Don't throw - let UI update even if save fails
    }
  };

  const handleMyProductDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setIsDragging(false);
    if (!over || active.id === over.id) return;

    const oldIndex = myProduct.photos.findIndex((p) => p === active.id);
    const newIndex = myProduct.photos.findIndex((p) => p === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newPhotos = arrayMove(myProduct.photos, oldIndex, newIndex);
      onUpdateProduct({ ...myProduct, photos: newPhotos });

      // ✅ Auto-save to database
      if (myProduct.asin) {
        saveImageOrder(myProduct.asin, newPhotos);
      }
    }
  };

  const handleCompetitorDragEnd = (compId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    setIsDragging(false);
    if (!over || active.id === over.id) return;

    const comp = competitors.find((c) => c.id === compId);
    if (!comp) return;

    const oldIndex = comp.photos.findIndex((p) => p === active.id);
    const newIndex = comp.photos.findIndex((p) => p === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newPhotos = arrayMove(comp.photos, oldIndex, newIndex);
      onUpdateCompetitor(compId, (p) => ({ ...p, photos: newPhotos }));

      // ✅ Auto-save to database
      if (comp.asin) {
        saveImageOrder(comp.asin, newPhotos);
      }
    }
  };

  const handleDragStart = () => setIsDragging(true);
  const handleDragCancel = () => setIsDragging(false);

  return {
    sensors,
    isDragging,
    handleMyProductDragEnd,
    handleCompetitorDragEnd,
    handleDragStart,
    handleDragCancel,
  };
}
