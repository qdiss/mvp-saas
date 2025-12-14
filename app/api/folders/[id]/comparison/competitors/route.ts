// app/api/folders/[id]/comparison/competitors/route.ts
// Save selected competitors and trigger background fetch

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/client";
import {
  comparisons,
  comparisonCompetitors,
  amazonProducts,
  productImages,
} from "@/database/schema";
import { eq } from "drizzle-orm";

async function fetchFromRainforest(params: any) {
  const url = new URL("https://api.rainforestapi.com/request");
  url.searchParams.append("api_key", process.env.RAINFOREST_API_KEY!);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Rainforest API error: ${response.statusText}`);
  }

  return response.json();
}

async function saveLightweightCompetitor(
  asin: string,
  marketplace: string,
  comparisonId: string,
  basicData?: any
) {
  // Check if exists
  const existing = await db
    .select()
    .from(amazonProducts)
    .where(eq(amazonProducts.asin, asin))
    .limit(1);

  if (existing.length > 0) {
    // Just update the comparison link
    await db
      .update(amazonProducts)
      .set({
        comparisonId,
        isMyProduct: false,
        updatedAt: new Date(),
      })
      .where(eq(amazonProducts.asin, asin));

    return existing[0];
  }

  // Save minimal placeholder
  const saved = await db
    .insert(amazonProducts)
    .values({
      asin,
      marketplace: marketplace as any,
      title: basicData?.title || "Loading...",
      brand: basicData?.brand || null,
      link: basicData?.link || null,
      price: basicData?.price?.toString() || null,
      currency: basicData?.currency || "USD",
      rating: basicData?.rating?.toString() || null,
      ratingsTotal: basicData?.ratingsTotal || 0,
      mainImageUrl: basicData?.imageUrl || null,
      imageUrls: basicData?.imageUrl ? [basicData.imageUrl] : [],
      imagesCount: basicData?.imageUrl ? 1 : 0,
      isMyProduct: false,
      comparisonId,
      lastFetchedAt: new Date(),
      fetchCount: 0,
      needsRefresh: true, // Mark for background fetch
      dataQuality: 20, // Low quality, needs full fetch
    })
    .returning();

  return saved[0];
}

async function fetchAndSaveCompetitor(
  asin: string,
  marketplace: string,
  comparisonId: string,
  position: number
) {
  try {
    console.log(`[COMPETITOR] Fetching full data for ${asin}...`);

    const productData = await fetchFromRainforest({
      type: "product",
      amazon_domain: `amazon.${marketplace}`,
      asin,
    });

    if (!productData.product) {
      console.error(`[COMPETITOR] Product ${asin} not found`);
      return { asin, success: false, error: "Product not found" };
    }

    const product = productData.product;
    const {
      title,
      link,
      brand,
      main_image,
      images,
      feature_bullets,
      rating,
      ratings_total,
      categories,
      bestsellers_rank,
      specifications,
      buybox_winner,
      description,
    } = product;

    // Save full data
    await db
      .update(amazonProducts)
      .set({
        title,
        brand: brand || null,
        link,
        price: buybox_winner?.price?.value?.toString() || null,
        currency: buybox_winner?.price?.currency || "USD",
        rrpValue: buybox_winner?.rrp?.value?.toString() || null,
        savingsAmount: buybox_winner?.savings?.amount?.toString() || null,
        savingsPercent: buybox_winner?.savings?.percentage?.toString() || null,
        hasCoupon: buybox_winner?.coupon?.badge ? true : false,
        couponText: buybox_winner?.coupon?.text || null,
        rating: rating?.toString() || null,
        ratingsTotal: ratings_total || 0,
        categoriesFlat: categories
          ? categories.map((c: any) => c.name).join(" > ")
          : null,
        categories: categories || null,
        bestsellerRank: bestsellers_rank || null,
        mainImageUrl: main_image?.link || null,
        imageUrls: images?.map((img: any) => img.link) || [],
        imagesCount: images?.length || 0,
        featureBullets: feature_bullets || [],
        featureBulletsCount: feature_bullets?.length || 0,
        description: description || null,
        specifications: specifications || null,
        isInStock: buybox_winner?.availability?.raw !== "Currently unavailable",
        isPrime: buybox_winner?.is_prime || false,
        isFulfilledByAmazon:
          buybox_winner?.fulfillment?.is_amazon_fulfilled || false,
        rawData: product,
        lastFetchedAt: new Date(),
        fetchCount: 1,
        needsRefresh: false,
        dataQuality: 100,
        updatedAt: new Date(),
      })
      .where(eq(amazonProducts.asin, asin));

    // Save images
    if (images && images.length > 0) {
      await db.delete(productImages).where(eq(productImages.asin, asin));

      const imageRecords = images
        .slice(0, 8)
        .map((img: any, index: number) => ({
          asin,
          imageUrl: img.link,
          variant: (index === 0 ? "MAIN" : `PT0${index}`) as any,
          position: index,
          detectedAt: new Date(),
          isNew: false,
        }));

      await db.insert(productImages).values(imageRecords);
    }

    console.log(`[COMPETITOR] ✓ Saved ${asin}`);
    return { asin, success: true };
  } catch (error: any) {
    console.error(`[COMPETITOR] ✗ Failed ${asin}:`, error.message);
    return { asin, success: false, error: error.message };
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: folderId } = await params;
    const body = await request.json();
    const {
      competitorAsins,
      competitorData = [],
      marketplace = "com",
      fetchInBackground = false,
    } = body;

    if (!competitorAsins || competitorAsins.length === 0) {
      return NextResponse.json(
        { error: "No competitors provided" },
        { status: 400 }
      );
    }

    console.log(
      `[SAVE COMPETITORS] Folder: ${folderId}, Count: ${competitorAsins.length}`
    );

    // Get comparison
    const [comparison] = await db
      .select()
      .from(comparisons)
      .where(eq(comparisons.folderId, folderId))
      .limit(1);

    if (!comparison) {
      return NextResponse.json(
        { error: "Comparison not found" },
        { status: 404 }
      );
    }

    // Delete old competitors
    await db
      .delete(comparisonCompetitors)
      .where(eq(comparisonCompetitors.comparisonId, comparison.id));

    // Save lightweight placeholders
    for (let i = 0; i < competitorAsins.length; i++) {
      const asin = competitorAsins[i];
      const basicData = competitorData.find((d: any) => d.asin === asin);

      await saveLightweightCompetitor(
        asin,
        marketplace,
        comparison.id,
        basicData
      );
    }

    // Add to link table
    const competitorRecords = competitorAsins.map(
      (asin: string, index: number) => ({
        comparisonId: comparison.id,
        asin,
        position: index,
        isVisible: true,
        addedBy: "system",
      })
    );

    await db.insert(comparisonCompetitors).values(competitorRecords);

    console.log(
      `[SAVE COMPETITORS] Added ${competitorAsins.length} to database`
    );

    // Fetch full details (immediate or background)
    if (fetchInBackground) {
      // Return immediately and fetch in background
      // Note: In production, use a proper job queue (BullMQ, etc.)
      console.log("[SAVE COMPETITORS] Queuing background fetch...");

      // Trigger async (don't await)
      Promise.all(
        competitorAsins.map((asin: string, idx: number) =>
          fetchAndSaveCompetitor(asin, marketplace, comparison.id, idx)
        )
      ).catch((err) => console.error("Background fetch error:", err));

      return NextResponse.json({
        success: true,
        message: `Saved ${competitorAsins.length} competitors, fetching full data in background`,
        status: "queued",
        stats: {
          total: competitorAsins.length,
          queued: competitorAsins.length,
        },
      });
    } else {
      // Fetch immediately (in batches)
      const batchSize = 3;
      const results = [];

      for (let i = 0; i < competitorAsins.length; i += batchSize) {
        const batch = competitorAsins.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map((asin: string, idx: number) =>
            fetchAndSaveCompetitor(asin, marketplace, comparison.id, i + idx)
          )
        );
        results.push(...batchResults);

        // Small delay between batches
        if (i + batchSize < competitorAsins.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      const successful = results.filter((r) => r?.success).length;
      const failed = results.filter((r) => !r?.success).length;

      console.log(
        `[SAVE COMPETITORS] Complete: ${successful} success, ${failed} failed`
      );

      return NextResponse.json({
        success: true,
        message: `Saved ${successful} competitors`,
        stats: {
          total: competitorAsins.length,
          successful,
          failed,
        },
        results,
      });
    }
  } catch (error: any) {
    console.error("[SAVE COMPETITORS Error]", error);
    return NextResponse.json(
      { error: "Failed to save competitors", details: error.message },
      { status: 500 }
    );
  }
}
