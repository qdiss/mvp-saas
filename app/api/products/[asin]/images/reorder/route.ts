// app/api/products/[asin]/images/reorder/route.ts
// ✅ NEW: Save image order to database

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/client";
import { amazonProducts } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ asin: string }> }
) {
  try {
    const { asin } = await params;
    const { imageUrls } = await request.json();

    if (!asin || !imageUrls || !Array.isArray(imageUrls)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    console.log(
      `[IMAGE REORDER] Updating ${asin} with ${imageUrls.length} images`
    );

    // Update the imageUrls array in database
    await db
      .update(amazonProducts)
      .set({
        imageUrls: imageUrls,
        updatedAt: new Date(),
      })
      .where(eq(amazonProducts.asin, asin));

    console.log(`[IMAGE REORDER] ✅ Updated ${asin}`);

    return NextResponse.json({
      success: true,
      message: "Image order saved",
    });
  } catch (error: any) {
    console.error("[IMAGE REORDER] Error:", error);
    return NextResponse.json(
      { error: "Failed to save image order", details: error.message },
      { status: 500 }
    );
  }
}
