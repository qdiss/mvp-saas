"use server";

import { db } from "@/database/client";
import {
  folders,
  profiles,
  organizations,
  organizationMappings,
} from "@/database/schema";
import { CreateFolderInput, ensureUserProfile } from "@/lib/actions/folders";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Helper to get or create internal org ID
async function getInternalOrgId(
  clerkOrgId: string,
  orgName?: string
): Promise<string> {
  try {
    // Check if mapping exists
    const mapping = await db.query.organizationMappings.findFirst({
      where: eq(organizationMappings.clerkOrgId, clerkOrgId),
    });

    if (mapping) {
      return mapping.internalOrgId;
    }

    // Create new organization and mapping
    const [org] = await db
      .insert(organizations)
      .values({
        name: orgName || `Organization ${clerkOrgId}`,
        // id will be auto-generated if it's a UUID default
      })
      .returning();

    await db.insert(organizationMappings).values({
      clerkOrgId,
      internalOrgId: org.id,
    });

    return org.id;
  } catch (error: any) {
    // Handle tenant not found error gracefully
    const isTenantError =
      error?.cause?.code === "XX000" ||
      error?.code === "XX000" ||
      (error instanceof Error &&
        error.message.includes("Tenant or user not found"));

    if (isTenantError) {
      throw new Error(
        "Database not initialized. Please contact support or try again later."
      );
    }

    throw error;
  }
}

export async function createFolder(
  clerkOrgId: string,
  userId: string,
  userEmail: string,
  data: CreateFolderInput,
  userFullName?: string | null,
  userImageUrl?: string | null,
  orgName?: string
) {
  try {
    await ensureUserProfile(userId, userEmail, userFullName, userImageUrl);

    // Get internal UUID for the organization
    const internalOrgId = await getInternalOrgId(clerkOrgId, orgName);

    const [folder] = await db
      .insert(folders)
      .values({
        organizationId: internalOrgId,
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

    // Handle tenant errors
    const isTenantError =
      error?.cause?.code === "XX000" ||
      error?.code === "XX000" ||
      (error instanceof Error &&
        error.message.includes("Tenant or user not found"));

    if (isTenantError) {
      return {
        success: false,
        error:
          "Organization database not ready. Please refresh the page or contact support.",
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create folder",
    };
  }
}
