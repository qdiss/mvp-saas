// app/api/folders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/database/client";
import { folders } from "@/database/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use orgId if available, otherwise use userId for personal folders
    const filterOrgId = orgId || userId;

    // Fetch all folders for this organization
    const userFolders = await db
      .select()
      .from(folders)
      .where(eq(folders.organizationId, filterOrgId))
      .orderBy(desc(folders.updatedAt));

    return NextResponse.json({
      success: true,
      folders: userFolders,
      count: userFolders.length,
    });
  } catch (error: any) {
    console.error("[GET Folders Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch folders", details: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, category, color, icon } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: "Name and category are required" },
        { status: 400 },
      );
    }

    const filterOrgId = orgId || userId;

    const [newFolder] = await db
      .insert(folders)
      .values({
        organizationId: filterOrgId,
        name,
        description,
        category,
        color: color || "#10b981",
        icon: icon || "Folder",
        createdBy: userId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      folder: newFolder,
    });
  } catch (error: any) {
    console.error("[CREATE Folder Error]", error);
    return NextResponse.json(
      { error: "Failed to create folder", details: error.message },
      { status: 500 },
    );
  }
}
