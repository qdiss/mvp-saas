// app/api/folders/[id]/comparison/route.ts
// FIXED: Now includes mainImageUrl for primary product

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/client";
import {
  comparisons,
  comparisonCompetitors,
  amazonProducts,
  productImages,
  folders,
} from "@/database/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: folderId } = await params;

    // 1. Find comparison
    const [comparison] = await db
      .select()
      .from(comparisons)
      .where(eq(comparisons.folderId, folderId))
      .limit(1);

    if (!comparison) {
      return NextResponse.json({
        success: true,
        comparison: null,
      });
    }

    // 2. Load MY PRODUCT
    let primaryProduct = null;
    const [myProduct] = await db
      .select()
      .from(amazonProducts)
      .where(
        and(
          eq(amazonProducts.comparisonId, comparison.id),
          eq(amazonProducts.isMyProduct, true)
        )
      )
      .limit(1);

    if (myProduct) {
      const images = await db
        .select()
        .from(productImages)
        .where(eq(productImages.asin, myProduct.asin))
        .orderBy(productImages.position);

      primaryProduct = {
        ...myProduct,
        images: images.map((img) => ({
          imageUrl: img.imageUrl,
          variant: img.variant,
          position: img.position,
        })),
      };
    }

    // 3. Load competitor links
    const competitorLinks = await db
      .select()
      .from(comparisonCompetitors)
      .where(eq(comparisonCompetitors.comparisonId, comparison.id))
      .orderBy(comparisonCompetitors.position);

    // 4. Load competitor full data
    const competitorProducts = await Promise.all(
      competitorLinks.map(async (link) => {
        const [product] = await db
          .select()
          .from(amazonProducts)
          .where(eq(amazonProducts.asin, link.asin))
          .limit(1);

        if (!product) return null;

        // Load images
        const images = await db
          .select()
          .from(productImages)
          .where(eq(productImages.asin, product.asin))
          .orderBy(productImages.position);

        return {
          asin: product.asin,
          title: product.title,
          brand: product.brand,
          link: product.link,

          // Pricing
          price: product.price,
          currency: product.currency,
          rrpValue: product.rrpValue,
          savingsAmount: product.savingsAmount,
          savingsPercent: product.savingsPercent,
          hasCoupon: product.hasCoupon,
          couponText: product.couponText,

          // Ratings
          rating: product.rating,
          ratingsTotal: product.ratingsTotal,

          // Categories
          categoriesFlat: product.categoriesFlat,
          categories: product.categories,

          // Bestseller
          bestsellerRank: product.bestsellerRank,

          // Images - FIXED: Map properly to photos array
          mainImageUrl: product.mainImageUrl,
          imageUrls: product.imageUrls || [],
          images: images.map((img) => ({
            imageUrl: img.imageUrl,
            variant: img.variant,
            position: img.position,
          })),

          // Features
          featureBullets: product.featureBullets || [],
          description: product.description,

          // Specifications
          specifications: product.specifications || [],

          // Availability
          isInStock: product.isInStock,
          isPrime: product.isPrime,

          // Raw data
          rawData: product.rawData,

          // Metadata
          matchScore: link.matchScore,
          position: link.position,
          addedAt: link.addedAt,
          isMyProduct: false,
        };
      })
    );

    // 5. Load folder
    const [folderData] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, folderId))
      .limit(1);

    return NextResponse.json({
      success: true,
      comparison: {
        id: comparison.id,
        name: comparison.name,
        status: comparison.status,
        marketplace: comparison.marketplace,

        primaryProduct: primaryProduct
          ? {
              asin: primaryProduct.asin,
              title: primaryProduct.title,
              brand: primaryProduct.brand,
              link: primaryProduct.link,
              price: primaryProduct.price,
              rating: primaryProduct.rating,
              ratingsTotal: primaryProduct.ratingsTotal,
              categoriesFlat: primaryProduct.categoriesFlat,
              bestsellerRank: primaryProduct.bestsellerRank,

              // ✅ FIXED: Now includes mainImageUrl
              mainImageUrl: primaryProduct.mainImageUrl,
              imageUrls: primaryProduct.imageUrls || [],
              images: primaryProduct.images,

              featureBullets: primaryProduct.featureBullets || [],
              specifications: primaryProduct.specifications || [],
              isInStock: primaryProduct.isInStock,
              isPrime: primaryProduct.isPrime,
              rawData: primaryProduct.rawData,
            }
          : null,

        competitorProducts: competitorProducts.filter((c) => c !== null),
      },
      folder: folderData,
    });
  } catch (error: any) {
    console.error("[Load Comparison Error]", error);
    return NextResponse.json(
      { error: "Failed to load", details: error.message },
      { status: 500 }
    );
  }
}
