// app/api/products/refresh/route.ts
// Batch refresh multiple products for up-to-date data

import { NextRequest, NextResponse } from "next/server";
import { amazonProducts, notifications } from "@/database/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/database/client";

async function fetchFromRainforest(endpoint: string, params: any) {
  const url = new URL("https://api.rainforestapi.com/request");
  url.searchParams.append("api_key", process.env.RAINFOREST_API_KEY!);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Rainforest API error: ${response.statusText}`);
  }

  return response.json();
}

async function detectChanges(oldProduct: any, newProduct: any) {
  const changes: any = {
    hasChanges: false,
    priceChanged: false,
    ratingChanged: false,
    stockChanged: false,
    newImages: false,
    details: [],
  };

  // Price change
  if (oldProduct.price !== newProduct.price) {
    changes.hasChanges = true;
    changes.priceChanged = true;
    changes.details.push({
      field: "price",
      oldValue: oldProduct.price,
      newValue: newProduct.price,
      change: parseFloat(newProduct.price) - parseFloat(oldProduct.price || 0),
    });
  }

  // Rating change
  if (oldProduct.rating !== newProduct.rating) {
    changes.hasChanges = true;
    changes.ratingChanged = true;
    changes.details.push({
      field: "rating",
      oldValue: oldProduct.rating,
      newValue: newProduct.rating,
      change:
        parseFloat(newProduct.rating) - parseFloat(oldProduct.rating || 0),
    });
  }

  // Stock change
  if (oldProduct.isInStock !== newProduct.isInStock) {
    changes.hasChanges = true;
    changes.stockChanged = true;
    changes.details.push({
      field: "stock",
      oldValue: oldProduct.isInStock ? "In Stock" : "Out of Stock",
      newValue: newProduct.isInStock ? "In Stock" : "Out of Stock",
    });
  }

  // Image changes
  const oldImages = oldProduct.imageUrls || [];
  const newImages = newProduct.imageUrls || [];

  if (JSON.stringify(oldImages) !== JSON.stringify(newImages)) {
    changes.hasChanges = true;
    changes.newImages = true;
    changes.details.push({
      field: "images",
      oldValue: oldImages.length,
      newValue: newImages.length,
      change: newImages.length - oldImages.length,
    });
  }

  return changes;
}

async function createNotification(
  userId: string,
  organizationId: string,
  type: string,
  title: string,
  message: string,
  productAsin: string,
  comparisonId?: string
) {
  await db.insert(notifications).values({
    userId,
    organizationId,
    type: type as any,
    title,
    message,
    productAsin,
    comparisonId: comparisonId || null,
    actionUrl: `/products/${productAsin}`,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      asins,
      comparisonId,
      marketplace = "com",
      userId = "system",
      organizationId,
    } = body;

    if (!asins || !Array.isArray(asins) || asins.length === 0) {
      return NextResponse.json(
        { error: "ASINs array is required" },
        { status: 400 }
      );
    }

    console.log(`[REFRESH] Refreshing ${asins.length} products`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const asin of asins) {
      try {
        // 1. Get existing product from DB
        const existingProduct = await db.query.amazonProducts.findFirst({
          where: eq(amazonProducts.asin, asin),
        });

        if (!existingProduct) {
          console.log(
            `[REFRESH] Product ${asin} not found in database, skipping`
          );
          errorCount++;
          continue;
        }

        // 2. Fetch fresh data from Rainforest
        const freshData = await fetchFromRainforest("product", {
          type: "product",
          amazon_domain: `amazon.${marketplace}`,
          asin: asin,
        });

        if (!freshData.product) {
          console.log(`[REFRESH] Failed to fetch ${asin} from Rainforest`);
          errorCount++;
          continue;
        }

        const product = freshData.product;

        // 3. Prepare updated data
        const updatedData = {
          title: product.title,
          price: product.buybox_winner?.price?.value?.toString() || null,
          rating: product.rating?.toString() || null,
          ratingsTotal: product.ratings_total || 0,
          isInStock:
            product.buybox_winner?.availability?.raw !==
            "Currently unavailable",
          availabilityRaw: product.buybox_winner?.availability?.raw,
          bestsellerRank: product.bestsellers_rank || null,
          imageUrls: product.images?.map((img: any) => img.link) || [],
          mainImageUrl: product.main_image?.link || null,
          featureBullets: product.feature_bullets || [],
          isPrime: product.buybox_winner?.is_prime || false,
          lastFetchedAt: new Date(),
          updatedAt: new Date(),
          rawData: product,
          needsRefresh: false,
        };

        // 4. Detect changes
        const changes = await detectChanges(existingProduct, updatedData);

        // 5. Update database
        await db
          .update(amazonProducts)
          .set(updatedData)
          .where(eq(amazonProducts.asin, asin));

        // 6. Create notifications if there are significant changes
        if (changes.hasChanges && organizationId) {
          if (changes.priceChanged) {
            const priceChange = changes.details.find(
              (d: any) => d.field === "price"
            );
            const direction =
              priceChange.change > 0 ? "increased" : "decreased";
            const amount = Math.abs(priceChange.change).toFixed(2);

            await createNotification(
              userId,
              organizationId,
              "price_change",
              `Price ${direction}`,
              `${product.title.substring(
                0,
                50
              )}... price ${direction} by $${amount}`,
              asin,
              comparisonId
            );
          }

          if (changes.stockChanged) {
            await createNotification(
              userId,
              organizationId,
              "stock_change",
              "Stock Status Changed",
              `${product.title.substring(0, 50)}... is now ${
                updatedData.isInStock ? "in stock" : "out of stock"
              }`,
              asin,
              comparisonId
            );
          }

          if (changes.ratingChanged) {
            const ratingChange = changes.details.find(
              (d: any) => d.field === "rating"
            );
            const direction =
              ratingChange.change > 0 ? "increased" : "decreased";

            await createNotification(
              userId,
              organizationId,
              "rating_change",
              `Rating ${direction}`,
              `${product.title.substring(0, 50)}... rating ${direction} to ${
                ratingChange.newValue
              }⭐`,
              asin,
              comparisonId
            );
          }
        }

        results.push({
          asin,
          success: true,
          changes: changes.hasChanges,
          changesDetail: changes.details,
        });

        successCount++;
      } catch (error: any) {
        console.error(`[REFRESH] Error refreshing ${asin}:`, error);

        results.push({
          asin,
          success: false,
          error: error.message,
        });

        errorCount++;
      }

      // Rate limiting: wait 200ms between requests
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.log(
      `[REFRESH] Complete: ${successCount} success, ${errorCount} errors`
    );

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: asins.length,
        successful: successCount,
        failed: errorCount,
      },
      message: `Refreshed ${successCount}/${asins.length} products`,
    });
  } catch (error: any) {
    console.error("[REFRESH Error]", error);

    return NextResponse.json(
      {
        error: "Refresh failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET - Check which products need refresh
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const comparisonId = searchParams.get("comparisonId");
  const hoursThreshold = parseInt(searchParams.get("hours") || "24");

  try {
    // Find products that haven't been updated in X hours
    const threshold = new Date();
    threshold.setHours(threshold.getHours() - hoursThreshold);

    let query = db
      .select()
      .from(amazonProducts)
      .where(sql`${amazonProducts.lastFetchedAt} < ${threshold}`)
      .limit(100);

    // If comparisonId provided, only get products in that comparison
    if (comparisonId) {
      // Join with comparison_competitors
      // (Simplified - adjust based on your needs)
    }

    const productsNeedingRefresh = await query;

    return NextResponse.json({
      success: true,
      count: productsNeedingRefresh.length,
      products: productsNeedingRefresh.map((p) => ({
        asin: p.asin,
        title: p.title,
        lastFetchedAt: p.lastFetchedAt,
        hoursOld: Math.floor(
          (Date.now() - new Date(p.lastFetchedAt!).getTime()) / (1000 * 60 * 60)
        ),
      })),
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to check refresh status", details: error.message },
      { status: 500 }
    );
  }
}
