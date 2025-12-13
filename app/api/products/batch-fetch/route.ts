// app/api/products/batch-fetch/route.ts
// Koristi ovo SAMO kada zatreba full data za odabrane konkurente

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/client";
import { amazonProducts } from "@/database/schema";
import { eq, inArray } from "drizzle-orm";

async function fetchFromRainforest(params: any) {
  const url = new URL("https://api.rainforestapi.com/request");
  url.searchParams.append("api_key", process.env.RAINFOREST_API_KEY!);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Rainforest API error`);
  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asins, marketplace = "com" } = body;

    if (!asins || !Array.isArray(asins) || asins.length === 0) {
      return NextResponse.json(
        { error: "ASINs array is required" },
        { status: 400 }
      );
    }

    // Limit to 5 products max to save tokens
    const limitedAsins = asins.slice(0, 5);

    console.log(`[BATCH] Fetching ${limitedAsins.length} products...`);

    const results = [];

    for (const asin of limitedAsins) {
      try {
        const productData = await fetchFromRainforest({
          type: "product",
          amazon_domain: `amazon.${marketplace}`,
          asin: asin,
        });

        if (!productData.product) {
          results.push({ asin, success: false, error: "Not found" });
          continue;
        }

        const product = productData.product;

        // Update full data
        await db
          .update(amazonProducts)
          .set({
            title: product.title,
            brand: product.brand,
            price: product.buybox_winner?.price?.value?.toString(),
            rating: product.rating?.toString(),
            ratingsTotal: product.ratings_total,
            featureBullets: product.feature_bullets || [],
            specifications: product.specifications || null,
            isInStock:
              product.buybox_winner?.availability?.raw !==
              "Currently unavailable",
            isPrime: product.buybox_winner?.is_prime || false,
            rawData: product,
            lastFetchedAt: new Date(),
            needsRefresh: false,
            updatedAt: new Date(),
          })
          .where(eq(amazonProducts.asin, asin));

        results.push({ asin, success: true });

        // Rate limit: 500ms between requests
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error: any) {
        results.push({ asin, success: false, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Fetched ${results.filter((r) => r.success).length}/${
        limitedAsins.length
      } products`,
    });
  } catch (error: any) {
    console.error("[BATCH Error]", error);
    return NextResponse.json(
      { error: "Batch fetch failed", details: error.message },
      { status: 500 }
    );
  }
}
