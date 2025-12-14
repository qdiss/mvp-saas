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
    const { id } = await params;

    const [folder] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, id))
      .limit(1);

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      folder,
    });
  } catch (error: any) {
    console.error("[GET Folder Error]", error);
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
    const { id } = await params;
    const body = await request.json();

    const { name, description, category, color, icon } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;

    const [updatedFolder] = await db
      .update(folders)
      .set(updateData)
      .where(eq(folders.id, id))
      .returning();

    if (!updatedFolder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      folder: updatedFolder,
    });
  } catch (error: any) {
    console.error("[UPDATE Folder Error]", error);
    return NextResponse.json(
      { error: "Failed to update folder", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.delete(folders).where(eq(folders.id, id));

    return NextResponse.json({
      success: true,
      message: "Folder deleted",
    });
  } catch (error: any) {
    console.error("[DELETE Folder Error]", error);
    return NextResponse.json(
      { error: "Failed to delete folder", details: error.message },
      { status: 500 }
    );
  }
}
