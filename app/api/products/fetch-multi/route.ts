// app/api/products/fetch-multi/route.ts
// ✅ FINAL: Uses centralized helpers with videos_additional support + TypeScript fixes

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/client";
import { comparisons, comparisonCompetitors, folders } from "@/database/schema";
import { eq } from "drizzle-orm";
import {
  fetchCompleteProductData,
  saveProductToDatabase,
} from "@/lib/rainforest-helpers";

// ✅ Type for product response
type ProductResponse = {
  asin?: string;
  title?: string;
  price?: number;
  rating?: number;
  ratingsTotal?: number;
  imageUrl?: string;
  images?: string[];
  brand?: string;
  link?: string;
  comparisonId: string;
  features?: string[];
  specifications?: any;
  isPrime?: boolean;
  inStock?: boolean;
  bestsellerRank?: any;
  hasVideo?: boolean;
  hasAPlusContent?: boolean;
};

// ✅ Type for error
type FetchError = {
  asin: string;
  error: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asins, marketplace = "com", folderId } = body;

    if (!asins || !Array.isArray(asins) || asins.length === 0) {
      return NextResponse.json(
        { error: "ASINs array is required" },
        { status: 400 }
      );
    }

    if (asins.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 ASINs allowed" },
        { status: 400 }
      );
    }

    if (!folderId) {
      return NextResponse.json(
        { error: "Folder ID is required" },
        { status: 400 }
      );
    }

    console.log(`[MULTI-ASIN] Fetching ${asins.length} products...`);

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
      comparison = existingComparison;
    } else {
      [comparison] = await db
        .insert(comparisons)
        .values({
          folderId,
          primaryProductType: "competitor",
          primaryAsin: asins[0],
          name: `Multi-Product Analysis`,
          marketplace: marketplace as any,
          status: "draft",
          createdBy: folder.createdBy,
        })
        .returning();
    }

    // ✅ Fetch all products in parallel (batches of 3 to respect rate limits)
    const batchSize = 3;
    const allProducts: ProductResponse[] = [];
    const errors: FetchError[] = [];

    for (let i = 0; i < asins.length; i += batchSize) {
      const batch = asins.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(async (asin: string, batchIndex: number) => {
          try {
            console.log(`[MULTI-ASIN] Fetching ${asin}...`);

            // ✅ Use centralized helper
            const productData = await fetchCompleteProductData(
              asin,
              marketplace
            );

            if (!productData) {
              throw new Error(`Product ${asin} not found`);
            }

            // First product is "My Product", rest are competitors
            const isMyProduct = i === 0 && batchIndex === 0;

            // ✅ Use centralized save function
            await saveProductToDatabase(
              productData,
              marketplace,
              isMyProduct,
              comparison.id
            );

            // Also create competitor link if not my product
            if (!isMyProduct) {
              await db
                .insert(comparisonCompetitors)
                .values({
                  comparisonId: comparison.id,
                  asin,
                  position: i + batchIndex,
                  isVisible: true,
                  addedBy: folder.createdBy,
                  addedAt: new Date(),
                })
                .onConflictDoNothing();
            }

            console.log(`[MULTI-ASIN] ✅ Saved ${asin}`);

            // Get saved product from database
            const saved = await db.query.amazonProducts.findFirst({
              where: (products, { eq }) => eq(products.asin, asin),
            });

            return {
              asin: saved?.asin,
              title: saved?.title,
              price: saved?.price,
              rating: saved?.rating,
              ratingsTotal: saved?.ratingsTotal,
              imageUrl: saved?.mainImageUrl,
              images: saved?.imageUrls,
              brand: saved?.brand,
              link: saved?.link,
              comparisonId: comparison.id,
              features: saved?.featureBullets,
              specifications: saved?.specifications,
              isPrime: saved?.isPrime,
              inStock: saved?.isInStock,
              bestsellerRank: saved?.bestsellerRank,
              hasVideo: saved?.hasVideo,
              hasAPlusContent: saved?.hasAPlusContent,
            } as ProductResponse;
          } catch (error: any) {
            console.error(
              `[MULTI-ASIN] ❌ Failed to fetch ${asin}:`,
              error.message
            );
            errors.push({ asin, error: error.message });
            return null;
          }
        })
      );

      // Extract successful results
      batchResults.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          allProducts.push(result.value);
        }
      });

      // Small delay between batches
      if (i + batchSize < asins.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    if (allProducts.length === 0) {
      return NextResponse.json(
        { error: "Failed to fetch any products" },
        { status: 500 }
      );
    }

    // Update comparison with first product as primary
    if (allProducts.length > 0) {
      await db
        .update(comparisons)
        .set({
          primaryAsin: allProducts[0].asin,
          name: `${allProducts[0].title?.substring(
            0,
            40
          )}... Multi-Product Analysis`,
          updatedAt: new Date(),
        })
        .where(eq(comparisons.id, comparison.id));
    }

    console.log(
      `[MULTI-ASIN] Successfully fetched ${allProducts.length}/${asins.length} products`
    );

    return NextResponse.json({
      success: true,
      products: allProducts,
      stats: {
        requested: asins.length,
        successful: allProducts.length,
        failed: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("[MULTI-ASIN Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch products", details: error.message },
      { status: 500 }
    );
  }
}
