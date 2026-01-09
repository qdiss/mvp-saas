"use server";

import { db } from "@/database/client";
import {
  folders,
  profiles,
  userProducts,
  comparisons,
} from "@/database/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface CreateFolderInput {
  name: string;
  description?: string;
  category: string;
  color?: string;
  icon?: string;
}

export interface UpdateFolderInput {
  name?: string;
  description?: string;
  category?: string;
  color?: string;
  icon?: string;
}

// Ensure user profile exists
export async function ensureUserProfile(
  userId: string,
  email: string,
  fullName?: string | null,
  imageUrl?: string | null
) {
  try {
    const existing = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
    });

    if (!existing) {
      await db.insert(profiles).values({
        id: userId,
        email,
        fullName: fullName || null,
        imageUrl: imageUrl || null,
      });
    }
  } catch (error) {
    console.error("Error ensuring user profile:", error);
    throw new Error("Failed to create user profile");
  }
}

// Create folder
export async function createFolder(
  orgId: string,
  userId: string,
  userEmail: string,
  data: CreateFolderInput,
  userFullName?: string | null,
  userImageUrl?: string | null
) {
  try {
    await ensureUserProfile(userId, userEmail, userFullName, userImageUrl);

    const [folder] = await db
      .insert(folders)
      .values({
        organizationId: orgId,
        name: data.name,
        description: data.description || null,
        category: data.category,
        color: data.color || "#10b981",
        icon: data.icon || "Folder",
        createdBy: userId,
      })
      .returning();

    revalidatePath("/dashboard");
    return { success: true, data: folder };
  } catch (error) {
    console.error("Error creating folder:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create folder",
    };
  }
}

// ⚡ OPTIMIZED: Get folders with stats and creator info in ONE query
// This replaces getFolders + individual getFolderStats + getUserProfile calls
export async function getFoldersWithStats(orgId: string) {
  try {
    // Single optimized query with joins
    const foldersWithStats = await db
      .select({
        id: folders.id,
        organizationId: folders.organizationId,
        name: folders.name,
        description: folders.description,
        category: folders.category,
        createdBy: folders.createdBy,
        createdAt: folders.createdAt,
        updatedAt: folders.updatedAt,
        color: folders.color,
        icon: folders.icon,
        creatorName: profiles.fullName,
        creatorEmail: profiles.email,
        productCount: sql<number>`cast(count(distinct ${userProducts.id}) as int)`,
        comparisonCount: sql<number>`cast(count(distinct ${comparisons.id}) as int)`,
      })
      .from(folders)
      .leftJoin(profiles, eq(folders.createdBy, profiles.id))
      .leftJoin(userProducts, eq(folders.id, userProducts.folderId))
      .leftJoin(comparisons, eq(folders.id, comparisons.folderId))
      .where(eq(folders.organizationId, orgId))
      .groupBy(
        folders.id,
        folders.organizationId,
        folders.name,
        folders.description,
        folders.category,
        folders.createdBy,
        folders.createdAt,
        folders.updatedAt,
        folders.color,
        folders.icon,
        profiles.fullName,
        profiles.email
      )
      .orderBy(sql`${folders.createdAt} desc`);

    // Transform to match expected format
    const transformedFolders = foldersWithStats.map((folder) => ({
      ...folder,
      stats: {
        products: folder.productCount,
        comments: folder.comparisonCount,
      },
      creatorName: folder.creatorName || "Unknown User",
    }));

    return { success: true, data: transformedFolders };
  } catch (error) {
    console.error("Error fetching folders with stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch folders",
      data: [],
    };
  }
}

// Keep original for backward compatibility (but prefer getFoldersWithStats)
export async function getFolders(orgId: string) {
  try {
    const folderList = await db.query.folders.findMany({
      where: eq(folders.organizationId, orgId),
      orderBy: (folders, { desc }) => [desc(folders.createdAt)],
    });

    return { success: true, data: folderList };
  } catch (error) {
    console.error("Error fetching folders:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch folders",
      data: [],
    };
  }
}

// Get single folder stats (if needed separately)
export async function getFolderStats(folderId: string) {
  try {
    const [stats] = await db
      .select({
        products: sql<number>`cast(count(distinct ${userProducts.id}) as int)`,
        comments: sql<number>`cast(count(distinct ${comparisons.id}) as int)`,
      })
      .from(folders)
      .leftJoin(userProducts, eq(folders.id, userProducts.folderId))
      .leftJoin(comparisons, eq(folders.id, comparisons.folderId))
      .where(eq(folders.id, folderId))
      .groupBy(folders.id);

    return {
      success: true,
      data: stats || { products: 0, comments: 0 },
    };
  } catch (error) {
    console.error("Error fetching folder stats:", error);
    return {
      success: false,
      error: "Failed to fetch folder stats",
      data: { products: 0, comments: 0 },
    };
  }
}

// Get user profile (cached)
export async function getUserProfile(userId: string) {
  try {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
    });

    return {
      success: true,
      data: profile
        ? {
            fullName: profile.fullName || "Unknown User",
            email: profile.email,
            imageUrl: profile.imageUrl,
          }
        : { fullName: "Unknown User", email: "", imageUrl: null },
    };
  } catch {
    return {
      success: false,
      data: { fullName: "Unknown User", email: "", imageUrl: null },
    };
  }
}

// Get single folder
export async function getFolder(folderId: string, orgId: string) {
  try {
    const folder = await db.query.folders.findFirst({
      where: and(eq(folders.id, folderId), eq(folders.organizationId, orgId)),
    });

    if (!folder) {
      return { success: false, error: "Folder not found" };
    }

    return { success: true, data: folder };
  } catch (error) {
    console.error("Error fetching folder:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch folder",
    };
  }
}

// Update folder
export async function updateFolder(
  folderId: string,
  orgId: string,
  data: UpdateFolderInput
) {
  try {
    const [updated] = await db
      .update(folders)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(folders.id, folderId), eq(folders.organizationId, orgId)))
      .returning();

    if (!updated) {
      return { success: false, error: "Folder not found" };
    }

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/folder/${folderId}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating folder:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update folder",
    };
  }
}

// Delete folder
export async function deleteFolder(folderId: string, orgId: string) {
  try {
    const [deleted] = await db
      .delete(folders)
      .where(and(eq(folders.id, folderId), eq(folders.organizationId, orgId)))
      .returning();

    if (!deleted) {
      return { success: false, error: "Folder not found" };
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting folder:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete folder",
    };
  }
}
