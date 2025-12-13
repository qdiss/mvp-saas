// ============================================
// API ROUTE: Create Image Comment
// app/api/comments/image/route.ts
// ============================================

import { createImageComment } from "@/lib/db/amazon-product-helpers";
import { useAuth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = useAuth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    imageId,
    comparisonId,
    content,
    xPosition,
    yPosition,
    assignedTo,
    dueDate,
  } = await req.json();

  try {
    const comment = await createImageComment({
      imageId,
      comparisonId,
      content,
      xPosition,
      yPosition,
      assignedTo,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      userId,
    });

    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
