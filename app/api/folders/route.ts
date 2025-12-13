// app/api/folders/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/client";
import { folders } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: folderId } = await params;

    const [folder] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, folderId))
      .limit(1);

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      folder,
    });
  } catch (error: any) {
    console.error("[Get Folder Error]", error);
    return NextResponse.json(
      { error: "Failed to get folder", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: folderId } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(folders)
      .set({
        name: body.name,
        description: body.description,
        category: body.category,
        updatedAt: new Date(),
      })
      .where(eq(folders.id, folderId))
      .returning();

    return NextResponse.json({
      success: true,
      folder: updated,
    });
  } catch (error: any) {
    console.error("[Update Folder Error]", error);
    return NextResponse.json(
      { error: "Failed to update folder", details: error.message },
      { status: 500 }
    );
  }
}
