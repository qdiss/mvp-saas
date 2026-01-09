// app/api/products/manual/route.ts
// Manually add product without API fetch

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/client";
import { amazonProducts, comparisons, folders } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      asin,
      title,
      brand,
      price,
      link,
      imageUrl,
      marketplace = "com",
      folderId,
    } = body;

    // All fields are now required for manual entry
    if (
      !asin ||
      !title ||
      !brand ||
      !price ||
      !link ||
      !imageUrl ||
      !folderId
    ) {
      return NextResponse.json(
        {
          error:
            "All fields (ASIN, title, brand, price, link, imageUrl) are required",
        },
        { status: 400 }
      );
    }

    console.log(`[MANUAL] Adding product ${asin} to folder ${folderId}`);

    // Check folder exists
    const [folder] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, folderId))
      .limit(1);

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Create or get comparison
    let comparison;
    const [existingComparison] = await db
      .select()
      .from(comparisons)
      .where(eq(comparisons.folderId, folderId))
      .limit(1);

    if (existingComparison) {
      [comparison] = await db
        .update(comparisons)
        .set({
          primaryAsin: asin,
          name: `${title.substring(0, 40)}... Analysis`,
          marketplace: marketplace as any,
          updatedAt: new Date(),
        })
        .where(eq(comparisons.id, existingComparison.id))
        .returning();
    } else {
      [comparison] = await db
        .insert(comparisons)
        .values({
          folderId,
          primaryProductType: "competitor",
          primaryAsin: asin,
          name: `${title.substring(0, 40)}... Analysis`,
          marketplace: marketplace as any,
          status: "draft",
          createdBy: "system",
        })
        .returning();
    }

    // Save product with minimal data
    const [savedProduct] = await db
      .insert(amazonProducts)
      .values({
        asin,
        marketplace: marketplace as any,
        title,
        brand: brand || null,
        link: link || null,
        price: price ? price.toString() : null,
        currency: "USD",
        mainImageUrl: imageUrl || null,
        imageUrls: imageUrl ? [imageUrl] : [],
        imagesCount: imageUrl ? 1 : 0,
        isMyProduct: true,
        comparisonId: comparison.id,
        lastFetchedAt: new Date(),
        fetchCount: 0,
        dataQuality: 20, // Low quality - manual entry
        needsRefresh: false,
      })
      .onConflictDoUpdate({
        target: [amazonProducts.asin],
        set: {
          title,
          brand: brand || null,
          link: link || null,
          price: price ? price.toString() : null,
          mainImageUrl: imageUrl || null,
          isMyProduct: true,
          comparisonId: comparison.id,
          updatedAt: new Date(),
        },
      })
      .returning();

    console.log(`[MANUAL] Product ${asin} saved successfully`);

    return NextResponse.json({
      success: true,
      product: {
        asin: savedProduct.asin,
        title: savedProduct.title,
        price: savedProduct.price,
        rating: savedProduct.rating,
        ratingsTotal: savedProduct.ratingsTotal,
        imageUrl: savedProduct.mainImageUrl,
        images: savedProduct.imageUrls,
        brand: savedProduct.brand,
        link: savedProduct.link,
        comparisonId: comparison.id,
        features: savedProduct.featureBullets || [],
        specifications: savedProduct.specifications || [],
        isPrime: savedProduct.isPrime,
        inStock: savedProduct.isInStock,
      },
      message: "Product added manually",
    });
  } catch (error: any) {
    console.error("[MANUAL Error]", error);
    return NextResponse.json(
      { error: "Failed to add product", details: error.message },
      { status: 500 }
    );
  }
}
