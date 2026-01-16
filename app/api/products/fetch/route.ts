// app/api/products/fetch/route.ts
// ✅ FIXED: Now returns related products when skipRelatedProducts=false

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/client";
import { comparisons, comparisonCompetitors, folders } from "@/database/schema";
import { eq } from "drizzle-orm";
import {
  fetchCompleteProductData,
  saveProductToDatabase,
} from "@/lib/rainforest-helpers";

// Main API Route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      asin,
      marketplace = "com",
      folderId,
      skipRelatedProducts = false,
    } = body;

    if (!asin || !folderId) {
      return NextResponse.json(
        { error: "ASIN and Folder ID required" },
        { status: 400 }
      );
    }

    console.log(`[FETCH] START: ${asin} in folder ${folderId}`);
    console.log(`[FETCH] Marketplace: ${marketplace}`);
    console.log(`[FETCH] Skip related: ${skipRelatedProducts}`);

    const startTime = Date.now();

    // 1. Check folder
    const [folder] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, folderId))
      .limit(1);

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // 2. ✅ Fetch product using centralized helper
    console.log(`[FETCH] Fetching from Rainforest API...`);

    const productData = await fetchCompleteProductData(asin, marketplace);

    if (!productData) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    console.log(`[FETCH] Product received (${Date.now() - startTime}ms)`, {
      asin: productData.asin,
      title: productData.title?.substring(0, 50),
      videosCount: productData.videos_count,
      hasVideosAdditional: !!productData.videos_additional,
      videosAdditionalLength: productData.videos_additional?.length || 0,
      hasAPlusContent: !!productData.a_plus_content,
    });

    // 3. Create or update comparison
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
          marketplace: marketplace as any,
          name: `${productData.title?.substring(0, 40)}... Analysis`,
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
          name: `${productData.title?.substring(0, 40)}... Analysis`,
          marketplace: marketplace as any,
          status: "draft",
          createdBy: folder.createdBy,
        })
        .returning();
    }

    // 4. ✅ Save using centralized helper (isMyProduct = true)
    console.log(`[FETCH] Saving as MY PRODUCT (isMyProduct=true)...`);

    await saveProductToDatabase(
      productData,
      marketplace,
      true, // ✅ isMyProduct = true
      comparison.id
    );

    console.log(`[FETCH] My Product saved (${Date.now() - startTime}ms)`);

    // 5. ✅ FIXED: Extract related products with search fallback
    let suggestedCompetitors: any[] = [];
    let stats: any = {
      competitorsFound: 0,
      processingTime: `${Date.now() - startTime}ms`,
      primarySource: "none",
      sources: {},
    };

    if (!skipRelatedProducts) {
      console.log(`[FETCH] Extracting related products from product data...`);

      // ✅ Try to extract from product data first
      const { extractRelatedProductsFromData, searchSimilarProducts } =
        await import("@/lib/rainforest-helpers");
      suggestedCompetitors = await extractRelatedProductsFromData(productData);

      // ✅ If no related products found, use search fallback
      if (suggestedCompetitors.length === 0) {
        console.log(
          `[FETCH] No related products in API response, trying search fallback...`
        );
        suggestedCompetitors = await searchSimilarProducts(
          productData,
          marketplace,
          10
        );
      }

      // Calculate stats
      const sourceCounts: Record<string, number> = {};
      suggestedCompetitors.forEach((comp) => {
        sourceCounts[comp.source] = (sourceCounts[comp.source] || 0) + 1;
      });

      const primarySource =
        Object.keys(sourceCounts).length > 0
          ? Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0][0]
          : "none";

      stats = {
        competitorsFound: suggestedCompetitors.length,
        processingTime: `${Date.now() - startTime}ms`,
        primarySource,
        sources: sourceCounts,
      };

      console.log(
        `[FETCH] ✅ Total competitors: ${suggestedCompetitors.length}`,
        stats
      );
    } else {
      console.log(`[FETCH] Skipping related products (search flow)`);
    }

    const totalTime = Date.now() - startTime;
    console.log(`[FETCH] COMPLETE in ${totalTime}ms`);

    // Get saved product from database
    const savedProduct = await db.query.amazonProducts.findFirst({
      where: (products, { eq }) => eq(products.asin, asin),
    });

    return NextResponse.json({
      success: true,
      product: {
        asin: savedProduct?.asin,
        title: savedProduct?.title,
        price: savedProduct?.price,
        rating: savedProduct?.rating,
        ratingsTotal: savedProduct?.ratingsTotal,
        imageUrl: savedProduct?.mainImageUrl,
        images: savedProduct?.imageUrls,
        brand: savedProduct?.brand,
        link: savedProduct?.link,
        comparisonId: comparison.id,
        features: savedProduct?.featureBullets,
        specifications: savedProduct?.specifications,
        isPrime: savedProduct?.isPrime,
        inStock: savedProduct?.isInStock,
        bestsellerRank: savedProduct?.bestsellerRank,
        hasVideo: savedProduct?.hasVideo,
        hasAPlusContent: savedProduct?.hasAPlusContent,
      },
      suggestedCompetitors,
      stats,
      message: "Product fetched successfully",
    });
  } catch (error: any) {
    console.error("[FETCH Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch product", details: error.message },
      { status: 500 }
    );
  }
}
