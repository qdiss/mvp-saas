"use server";

import { db } from "@/database/client";
import {
  folders,
  profiles,
  userProducts,
  comparisons,
  comparisonMessages,
} from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface CreateFolderInput {
  name: string;
  description?: string;
  category: string;
  color?: string; // NOVO
  icon?: string;
}

export interface UpdateFolderInput {
  name?: string;
  description?: string;
  category?: string;
}

// Ensure user profile exists
export async function ensureUserProfile(
  userId: string,
  email: string,
  fullName?: string | null,
  imageUrl?: string | null
) {
  try {
    // Check if profile exists
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
    // Ensure profile exists
    await ensureUserProfile(userId, userEmail, userFullName, userImageUrl);

    // Create folder
    const [folder] = await db
      .insert(folders)
      .values({
        organizationId: orgId,
        name: data.name,
        description: data.description || null,
        category: data.category,
        color: data.color || "#10b981", // NOVO
        icon: data.icon || "Folder", // NOVO
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

// Get folder stats
export async function getFolderStats(folderId: string) {
  try {
    // Count products in folder
    const products = await db.query.userProducts.findMany({
      where: eq(userProducts.folderId, folderId),
    });

    // Count comparison messages (comments) for all comparisons in folder
    const folderComparisons = await db.query.comparisons.findMany({
      where: eq(comparisons.folderId, folderId),
    });

    let totalComments = 0;
    for (const comparison of folderComparisons) {
      const messages = await db.query.comparisonMessages.findMany({
        where: eq(comparisonMessages.comparisonId, comparison.id),
      });
      totalComments += messages.length;
    }

    return {
      success: true,
      data: {
        products: products.length,
        comments: totalComments,
      },
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

// Get user profile
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
  } catch (error) {
    return {
      success: false,
      data: { fullName: "Unknown User", email: "", imageUrl: null },
    };
  }
}

// Get folders for organization
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
