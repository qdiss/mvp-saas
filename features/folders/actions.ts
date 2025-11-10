"use server";

import { db } from "@/database/client";
import {
  folders,
  profiles,
  organizations,
  organizationMappings,
} from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Helper to get or create internal org ID
async function getInternalOrgId(clerkOrgId: string): Promise<string> {
  // Check if mapping exists
  const mapping = await db.query.organizationMappings.findFirst({
    where: eq(organizationMappings.clerkOrgId, clerkOrgId),
  });

  if (mapping) {
    return mapping.internalOrgId;
  }

  // Create new organization and mapping
  const [org] = await db.insert(organizations).values({}).returning();

  await db.insert(organizationMappings).values({
    clerkOrgId,
    internalOrgId: org.id,
  });

  return org.id;
}

export async function createFolder(
  clerkOrgId: string,
  userId: string,
  userEmail: string,
  data: CreateFolderInput,
  userFullName?: string | null,
  userImageUrl?: string | null
) {
  try {
    await ensureUserProfile(userId, userEmail, userFullName, userImageUrl);

    // Get internal UUID for the organization
    const internalOrgId = await getInternalOrgId(clerkOrgId);

    const [folder] = await db
      .insert(folders)
      .values({
        organizationId: internalOrgId, // Now uses UUID
        name: data.name,
        description: data.description || null,
        category: data.category,
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
