// app/api/products/[asin]/route.ts
// Delete product from comparison

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/client";
import {
  amazonProducts,
  productImages,
  comparisonCompetitors,
} from "@/database/schema";
import { eq, and } from "drizzle-orm";

// DELETE - Remove product from comparison
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ asin: string }> }
) {
  try {
    const { asin } = await params;

    if (!asin) {
      return NextResponse.json({ error: "ASIN required" }, { status: 400 });
    }

    console.log(`[DELETE] Removing product ${asin}`);

    // 1. Remove from comparison_competitors table
    await db
      .delete(comparisonCompetitors)
      .where(eq(comparisonCompetitors.asin, asin));

    // 2. Remove product images
    await db.delete(productImages).where(eq(productImages.asin, asin));

    // 3. Remove from amazon_products (if not referenced elsewhere)
    // Note: We keep the product in amazon_products if it might be used in other comparisons
    // Only remove it from the comparison link
    await db
      .update(amazonProducts)
      .set({
        isMyProduct: false,
        comparisonId: null,
      })
      .where(eq(amazonProducts.asin, asin));

    console.log(`[DELETE] Product ${asin} removed successfully`);

    return NextResponse.json({
      success: true,
      message: "Product removed from comparison",
    });
  } catch (error: any) {
    console.error("[DELETE Product Error]", error);
    return NextResponse.json(
      { error: "Failed to delete product", details: error.message },
      { status: 500 }
    );
  }
}

// GET - Fetch single product details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ asin: string }> }
) {
  try {
    const { asin } = await params;

    if (!asin) {
      return NextResponse.json({ error: "ASIN required" }, { status: 400 });
    }

    const [product] = await db
      .select()
      .from(amazonProducts)
      .where(eq(amazonProducts.asin, asin))
      .limit(1);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.asin, asin))
      .orderBy(productImages.position);

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        images: images.map((img) => ({
          imageUrl: img.imageUrl,
          variant: img.variant,
          position: img.position,
        })),
      },
    });
  } catch (error: any) {
    console.error("[GET Product Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch product", details: error.message },
      { status: 500 }
    );
  }
}
