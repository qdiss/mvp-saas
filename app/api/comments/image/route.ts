// app/api/comments/image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/database/client";
import { imageComments, commentImages } from "@/database/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const comparisonId = searchParams.get("comparisonId");

    console.log("[COMMENTS API] GET request for comparisonId:", comparisonId);

    if (!comparisonId) {
      return NextResponse.json({
        success: true,
        comments: [],
      });
    }

    // Get comments with their associated images
    const comments = await db
      .select({
        id: imageComments.id,
        comparisonId: imageComments.comparisonId,
        content: imageComments.content,
        status: imageComments.status,
        assignedTo: imageComments.assignedTo,
        dueDate: imageComments.dueDate,
        resolvedAt: imageComments.resolvedAt,
        resolvedBy: imageComments.resolvedBy,
        createdBy: imageComments.createdBy,
        createdAt: imageComments.createdAt,
        updatedAt: imageComments.updatedAt,
      })
      .from(imageComments)
      .where(eq(imageComments.comparisonId, comparisonId))
      .orderBy(sql`${imageComments.createdAt} DESC`);

    // Get images for each comment
    const commentsWithImages = await Promise.all(
      comments.map(async (comment) => {
        const images = await db
          .select()
          .from(commentImages)
          .where(eq(commentImages.commentId, comment.id));

        return {
          ...comment,
          images: images.map((img) => img.imageUrl),
          imageCount: images.length,
        };
      })
    );

    console.log("[COMMENTS API] Found", commentsWithImages.length, "comments");

    return NextResponse.json({
      success: true,
      comments: commentsWithImages,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const userName =
      user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.firstName ||
          user?.emailAddresses[0]?.emailAddress ||
          "Unknown User";

    const body = await request.json();
    const { imageUrls, content, comparisonId } = body; // Now expecting array of imageUrls

    console.log("[COMMENT API] Creating comment by:", userName);
    console.log("[COMMENT API] For", imageUrls?.length, "images");

    if (!comparisonId || !imageUrls || imageUrls.length === 0) {
      return NextResponse.json(
        { error: "comparisonId and imageUrls are required" },
        { status: 400 }
      );
    }

    // Create the comment
    const [comment] = await db
      .insert(imageComments)
      .values({
        content: content,
        comparisonId: comparisonId,
        status: "open",
        createdBy: userName,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Link images to comment
    await db.insert(commentImages).values(
      imageUrls.map((url: string) => ({
        commentId: comment.id,
        imageUrl: url,
      }))
    );

    console.log("[COMMENT API] Created comment with ID:", comment.id);

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        images: imageUrls,
        imageCount: imageUrls.length,
      },
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Comment ID required" },
        { status: 400 }
      );
    }

    const user = await currentUser();
    const userName =
      user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.firstName || "Unknown User";

    const updates: any = {
      updatedAt: new Date(),
    };

    // Handle status changes
    if (body.status) {
      updates.status = body.status;

      if (body.status === "resolved") {
        updates.resolvedAt = new Date();
        updates.resolvedBy = userName;
      }
    }

    // Handle content updates
    if (body.content !== undefined) {
      updates.content = body.content;
    }

    const [updated] = await db
      .update(imageComments)
      .set(updates)
      .where(eq(imageComments.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      comment: updated,
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Comment ID required" },
        { status: 400 }
      );
    }

    // Delete will cascade to comment_images
    await db.delete(imageComments).where(eq(imageComments.id, id));

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
