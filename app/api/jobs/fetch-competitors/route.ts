// app/api/jobs/fetch-competitors/route.ts
// Background job to fetch full competitor details in batches

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/client";
import {
  amazonProducts,
  productImages,
  comparisonCompetitors,
} from "@/database/schema";
import { eq, and } from "drizzle-orm";

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

async function fetchAndUpdateCompetitor(asin: string, marketplace: string) {
  try {
    console.log(`[JOB] Fetching ${asin}...`);

    const productData = await fetchFromRainforest({
      type: "product",
      amazon_domain: `amazon.${marketplace}`,
      asin,
    });

    if (!productData.product) {
      console.error(`[JOB] Product ${asin} not found`);
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

    // Update existing product with full data
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

    console.log(`[JOB] ✓ Updated ${asin}`);
    return { asin, success: true };
  } catch (error: any) {
    console.error(`[JOB] ✗ Failed ${asin}:`, error.message);
    return { asin, success: false, error: error.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { comparisonId, asins, marketplace = "com", batchSize = 3 } = body;

    if (!asins || asins.length === 0) {
      return NextResponse.json({ error: "No ASINs provided" }, { status: 400 });
    }

    console.log(`[JOB] Processing ${asins.length} competitors...`);
    const startTime = Date.now();

    const results = [];

    // Process in batches to avoid rate limits
    for (let i = 0; i < asins.length; i += batchSize) {
      const batch = asins.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map((asin: string) => fetchAndUpdateCompetitor(asin, marketplace))
      );

      results.push(
        ...batchResults.map((result) =>
          result.status === "fulfilled"
            ? result.value
            : { success: false, error: result.reason }
        )
      );

      // Delay between batches (rate limiting)
      if (i + batchSize < asins.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    const totalTime = Date.now() - startTime;
    console.log(
      `[JOB] Complete in ${totalTime}ms: ${successful} success, ${failed} failed`
    );

    return NextResponse.json({
      success: true,
      stats: {
        total: asins.length,
        successful,
        failed,
        processingTime: `${totalTime}ms`,
      },
      results,
    });
  } catch (error: any) {
    console.error("[JOB Error]", error);
    return NextResponse.json(
      { error: "Job failed", details: error.message },
      { status: 500 }
    );
  }
}
