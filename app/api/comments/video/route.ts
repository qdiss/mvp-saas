// app/api/comments/video/route.ts
// ✅ IDENTICAL to image comments API - uses Clerk auth

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/database/client";
import { videoComments } from "@/database/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const comparisonId = searchParams.get("comparisonId");
    const commentId = searchParams.get("id");

    console.log(
      "[VIDEO COMMENTS API] GET request for comparisonId:",
      comparisonId
    );

    if (commentId) {
      // Get single comment
      const [comment] = await db
        .select()
        .from(videoComments)
        .where(eq(videoComments.id, commentId))
        .limit(1);

      if (!comment) {
        return NextResponse.json(
          { error: "Comment not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        comment: {
          ...comment,
          videos: comment.videoUrls, // Map videoUrls to videos for consistency
        },
      });
    }

    if (comparisonId) {
      // Get all comments for comparison
      const comments = await db
        .select()
        .from(videoComments)
        .where(eq(videoComments.comparisonId, comparisonId))
        .orderBy(sql`${videoComments.createdAt} DESC`);

      console.log("[VIDEO COMMENTS API] Found", comments.length, "comments");

      return NextResponse.json({
        success: true,
        comments: comments.map((c) => ({
          ...c,
          videos: c.videoUrls, // Map videoUrls to videos for consistency
        })),
      });
    }

    return NextResponse.json({
      success: true,
      comments: [],
    });
  } catch (error: any) {
    console.error("[VIDEO COMMENTS GET Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch comments", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ Get authenticated user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Get full user name from Clerk
    const user = await currentUser();
    const userName =
      user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.firstName ||
          user?.emailAddresses[0]?.emailAddress ||
          "Unknown User";

    const body = await request.json();
    const { videoUrls, content, comparisonId } = body;

    console.log("[VIDEO COMMENT API] Creating comment by:", userName);
    console.log("[VIDEO COMMENT API] For", videoUrls?.length, "videos");

    if (!comparisonId || !videoUrls || videoUrls.length === 0) {
      return NextResponse.json(
        { error: "comparisonId and videoUrls are required" },
        { status: 400 }
      );
    }

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Create the comment
    const [comment] = await db
      .insert(videoComments)
      .values({
        content: content.trim(),
        comparisonId: comparisonId,
        videoUrls: videoUrls,
        status: "open",
        createdBy: userName, // ✅ Use real user name
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log("[VIDEO COMMENT API] Created comment with ID:", comment.id);

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        videos: comment.videoUrls, // Map videoUrls to videos for consistency
      },
    });
  } catch (error: any) {
    console.error("[VIDEO COMMENT POST Error]", error);
    return NextResponse.json(
      { error: "Failed to create comment", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // ✅ Get authenticated user
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

    // ✅ Get full user name from Clerk
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
        updates.resolvedBy = userName; // ✅ Use real user name
      }
    }

    // Handle content updates
    if (body.content !== undefined) {
      updates.content = body.content;
    }

    console.log(
      `[VIDEO COMMENT API] Updating ${id} to ${body.status} by ${userName}`
    );

    const [updatedComment] = await db
      .update(videoComments)
      .set(updates)
      .where(eq(videoComments.id, id))
      .returning();

    if (!updatedComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    console.log(`[VIDEO COMMENT API] Updated ${id}`);

    return NextResponse.json({
      success: true,
      comment: {
        ...updatedComment,
        videos: updatedComment.videoUrls, // Map videoUrls to videos for consistency
      },
    });
  } catch (error: any) {
    console.error("[VIDEO COMMENT PATCH Error]", error);
    return NextResponse.json(
      { error: "Failed to update comment", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // ✅ Get authenticated user
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

    const user = await currentUser();
    const userName =
      user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.firstName || "Unknown User";

    console.log(`[VIDEO COMMENT API] Deleting ${id} by ${userName}`);

    await db.delete(videoComments).where(eq(videoComments.id, id));

    console.log(`[VIDEO COMMENT API] Deleted ${id}`);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("[VIDEO COMMENT DELETE Error]", error);
    return NextResponse.json(
      { error: "Failed to delete comment", details: error.message },
      { status: 500 }
    );
  }
}
