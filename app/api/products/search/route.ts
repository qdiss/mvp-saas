// app/api/products/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { amazonProducts, keywordSearches } from "@/database/schema";
import { and, gte, lte, eq, inArray, ilike, sql } from "drizzle-orm";
import { db } from "@/database/client";

async function fetchFromRainforest(endpoint: string, params: any) {
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

async function saveProductToDatabase(productData: any, marketplace: string) {
  // Reuse funkciju iz prethodnog fajla
  // (skraćeno radi prostora - koristi istu logiku)

  const savedProduct = await db
    .insert(amazonProducts)
    .values({
      asin: productData.asin,
      marketplace: marketplace as any,
      title: productData.title,
      brand: productData.brand,
      link: productData.link,
      price: productData.price?.value?.toString(),
      currency: productData.price?.currency,
      rating: productData.rating?.toString(),
      ratingsTotal: productData.ratings_total,
      mainImageUrl: productData.image,
      imageUrls: productData.images?.map((i: any) => i.link) || [],
      categories: productData.categories,
      isPrime: productData.is_prime || false,
      lastFetchedAt: new Date(),
      rawData: productData,
    })
    .onConflictDoUpdate({
      target: [amazonProducts.asin],
      set: {
        price: productData.price?.value?.toString(),
        rating: productData.rating?.toString(),
        ratingsTotal: productData.ratings_total,
        lastFetchedAt: new Date(),
      },
    })
    .returning();

  return savedProduct[0];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      keyword,
      marketplace = "com",
      comparisonId,
      folderId,
      filters = {},
      maxResults = 20,
    } = body;

    if (!keyword) {
      return NextResponse.json(
        { error: "Keyword is required" },
        { status: 400 }
      );
    }

    console.log(`[SEARCH] Keyword: "${keyword}", Marketplace: ${marketplace}`);

    // Build Rainforest search params
    const searchParams: any = {
      type: "search",
      amazon_domain: `amazon.${marketplace}`,
      search_term: keyword,
      max_page: Math.ceil(maxResults / 48), // Rainforest returns ~48 per page
    };

    // Apply filters
    if (filters.minPrice) {
      searchParams.min_price = filters.minPrice;
    }
    if (filters.maxPrice) {
      searchParams.max_price = filters.maxPrice;
    }
    if (filters.minRating) {
      searchParams.customer_review = filters.minRating; // 4 stars & up
    }
    if (filters.primeOnly) {
      searchParams.prime_eligible = "1";
    }
    if (filters.sortBy) {
      searchParams.sort_by = filters.sortBy; // "price_low_to_high", "price_high_to_low", "most_reviewed"
    }

    // Execute search
    const searchResults = await fetchFromRainforest("search", searchParams);

    if (
      !searchResults.search_results ||
      searchResults.search_results.length === 0
    ) {
      return NextResponse.json({
        success: true,
        results: [],
        totalResults: 0,
        message: "No products found",
      });
    }

    const products = searchResults.search_results.slice(0, maxResults);

    console.log(`[SEARCH] Found ${products.length} products`);

    // Calculate aggregated stats
    const prices = products
      .map((p: any) => p.price?.value)
      .filter((p: number) => p != null);

    const ratings = products
      .map((p: any) => p.rating)
      .filter((r: number) => r != null);

    const stats = {
      totalResults: products.length,
      avgPrice:
        prices.length > 0
          ? (
              prices.reduce((a: number, b: number) => a + b, 0) / prices.length
            ).toFixed(2)
          : null,
      minPrice: prices.length > 0 ? Math.min(...prices) : null,
      maxPrice: prices.length > 0 ? Math.max(...prices) : null,
      avgRating:
        ratings.length > 0
          ? (
              ratings.reduce((a: number, b: number) => a + b, 0) /
              ratings.length
            ).toFixed(2)
          : null,
      primeCount: products.filter((p: any) => p.is_prime).length,
    };

    // Save products to database in background
    const savedAsins: string[] = [];

    for (const product of products) {
      try {
        const saved = await saveProductToDatabase(product, marketplace);
        savedAsins.push(saved.asin);
      } catch (error) {
        console.error(`Error saving product ${product.asin}:`, error);
      }
    }

    // Save search record
    if (comparisonId || folderId) {
      await db.insert(keywordSearches).values({
        comparisonId: comparisonId || null,
        folderId: folderId || null,
        keyword,
        marketplace: marketplace as any,
        filters,
        totalResults: products.length,
        avgRating: stats.avgRating?.toString() || null,
        avgPrice: stats.avgPrice?.toString() || null,
        priceRange: {
          min: stats.minPrice,
          max: stats.maxPrice,
        },
        topAsins: savedAsins.slice(0, 20),
        searchedBy: "system", // Replace with actual user ID
      });
    }

    // Return results
    return NextResponse.json({
      success: true,
      results: products.map((p: any) => ({
        asin: p.asin,
        title: p.title,
        brand: p.brand,
        price: p.price?.value,
        currency: p.price?.currency,
        rating: p.rating,
        ratingsTotal: p.ratings_total,
        imageUrl: p.image,
        link: p.link,
        isPrime: p.is_prime || false,
        bestsellerRank: p.bestsellers_rank?.[0]?.rank,
        category: p.categories?.[0]?.name,
      })),
      stats,
      savedAsins,
      message: `Found ${products.length} products for "${keyword}"`,
    });
  } catch (error: any) {
    console.error("[SEARCH Error]", error);

    return NextResponse.json(
      {
        error: "Search failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET - Search in existing database
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const keyword = searchParams.get("keyword");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minRating = searchParams.get("minRating");
  const category = searchParams.get("category");
  const brand = searchParams.get("brand");
  const marketplace = searchParams.get("marketplace") || "com";

  try {
    const conditions = [];

    // Marketplace filter
    conditions.push(eq(amazonProducts.marketplace, marketplace as any));

    // Keyword search (full-text on title, brand, keywords)
    if (keyword) {
      conditions.push(
        sql`(
          ${amazonProducts.title} ILIKE ${"%" + keyword + "%"} OR
          ${amazonProducts.brand} ILIKE ${"%" + keyword + "%"} OR
          ${amazonProducts.featureBulletsFlat} ILIKE ${"%" + keyword + "%"}
        )`
      );
    }

    // Price range
    if (minPrice) {
      conditions.push(gte(amazonProducts.price, minPrice));
    }
    if (maxPrice) {
      conditions.push(lte(amazonProducts.price, maxPrice));
    }

    // Rating filter
    if (minRating) {
      conditions.push(gte(amazonProducts.rating, minRating));
    }

    // Category filter
    if (category) {
      conditions.push(ilike(amazonProducts.categoriesFlat, `%${category}%`));
    }

    // Brand filter
    if (brand) {
      conditions.push(eq(amazonProducts.brand, brand));
    }

    const results = await db
      .select()
      .from(amazonProducts)
      .where(and(...conditions))
      .limit(50)
      .orderBy(sql`${amazonProducts.rating} DESC NULLS LAST`);

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
      source: "database",
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Database search failed", details: error.message },
      { status: 500 }
    );
  }
}
