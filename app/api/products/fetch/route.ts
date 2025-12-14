// app/api/products/fetch/route.ts
// OPTIMIZED: Uses REAL Amazon related products (also_viewed priority)

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/client";
import {
  amazonProducts,
  productImages,
  comparisons,
  comparisonCompetitors,
  folders,
} from "@/database/schema";
import { eq, and } from "drizzle-orm";

// Rainforest API helper
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

// Save FULL product data
async function saveFullProductToDatabase(
  productData: any,
  marketplace: string,
  isMyProduct: boolean,
  comparisonId: string | null
) {
  const {
    asin,
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
    videos,
    frequently_bought_together,
    also_viewed,
  } = productData;

  const productRecord = await db
    .insert(amazonProducts)
    .values({
      asin,
      marketplace: marketplace as any,
      title,
      brand: brand || null,
      link,
      isMyProduct,
      comparisonId,

      // Pricing
      price: buybox_winner?.price?.value?.toString() || null,
      currency: buybox_winner?.price?.currency || "USD",
      priceSymbol: buybox_winner?.price?.symbol || "$",
      priceRaw: buybox_winner?.price?.raw || null,
      rrpValue: buybox_winner?.rrp?.value?.toString() || null,
      rrpRaw: buybox_winner?.rrp?.raw || null,
      savingsAmount: buybox_winner?.savings?.amount?.toString() || null,
      savingsPercent: buybox_winner?.savings?.percentage?.toString() || null,
      hasCoupon: buybox_winner?.coupon?.badge ? true : false,
      couponText: buybox_winner?.coupon?.text || null,
      dealType: productData.deal_type || null,
      dealBadge: productData.deal_badge || null,

      // Ratings
      rating: rating?.toString() || null,
      ratingsTotal: ratings_total || 0,
      reviewCount: ratings_total || 0,
      ratingBreakdown: productData.rating_breakdown || null,

      // Categories
      categories: categories || null,
      categoriesFlat: categories
        ? categories.map((c: any) => c.name).join(" > ")
        : null,
      categoryIds: categories
        ? categories.map((c: any) => c.category_id)
        : null,
      categoryBreadcrumbs: categories
        ? categories.map((c: any) => c.name)
        : null,
      searchAlias: productData.search_alias?.value || null,
      searchAliasTitle: productData.search_alias?.title || null,

      // Keywords
      keywords: productData.keywords || null,
      keywordsList: productData.keywords_list || null,

      // Bestseller
      bestsellerRank: bestsellers_rank || null,
      bestsellerRankFlat: bestsellers_rank
        ? bestsellers_rank
            .map((r: any) => `#${r.rank} in ${r.category}`)
            .join(", ")
        : null,

      // Images
      mainImageUrl: main_image?.link || null,
      imageUrls: images?.map((img: any) => img.link) || [],
      imagesCount: images?.length || 0,
      has360View: productData.has_360_view || false,
      hasVideo: videos && videos.length > 0 ? true : false,

      // Features
      featureBullets: feature_bullets || [],
      featureBulletsCount: feature_bullets?.length || 0,
      featureBulletsFlat: feature_bullets ? feature_bullets.join(" ") : null,
      description: description || null,
      descriptionHtml: productData.description_html || null,

      // Specifications
      specifications: specifications || null,
      specificationsFlat: specifications
        ? specifications.map((s: any) => `${s.name}: ${s.value}`).join("; ")
        : null,

      // Dimensions & Details
      dimensions: productData.product_information?.dimensions || null,
      weight: productData.product_information?.weight || null,
      itemModelNumber:
        productData.product_information?.item_model_number || null,
      manufacturer: productData.product_information?.manufacturer || null,
      material: productData.product_information?.material || null,
      color: productData.product_information?.color || null,
      size: productData.product_information?.size || null,

      // Availability
      isInStock: buybox_winner?.availability?.raw !== "Currently unavailable",
      availabilityType: buybox_winner?.availability?.type || null,
      availabilityRaw: buybox_winner?.availability?.raw || null,
      dispatchDays: buybox_winner?.availability?.dispatch_days || null,

      // Prime & Fulfillment
      isPrime: buybox_winner?.is_prime || false,
      isPrimeExclusive: productData.is_prime_exclusive || false,
      isFulfilledByAmazon:
        buybox_winner?.fulfillment?.is_amazon_fulfilled || false,
      isSoldByAmazon: buybox_winner?.fulfillment?.is_sold_by_amazon || false,
      isThirdParty: buybox_winner?.fulfillment?.third_party_seller
        ? true
        : false,
      primeShippingSpeed: buybox_winner?.shipping?.raw || null,
      hasFreeReturns: buybox_winner?.returns?.raw?.includes("FREE") || false,

      // Seller
      thirdPartySeller: buybox_winner?.fulfillment?.third_party_seller || null,
      sellerName: buybox_winner?.fulfillment?.third_party_seller?.name || null,

      // Brand Content
      hasAPlusContent: productData.a_plus_content ? true : false,
      aPlusModules: productData.a_plus_content || null,
      hasBrandStory: productData.brand_story ? true : false,
      brandStoreId: productData.brand_store?.id || null,
      brandStoreLink: productData.brand_store?.link || null,

      // Compliance
      isDiscontinued: productData.is_discontinued || false,
      prop65Warning: productData.prop_65_warning ? true : false,

      // Variations
      isBundle: productData.is_bundle || false,
      hasVariations: productData.variants && productData.variants.length > 1,
      variationCount: productData.variants?.length || 0,
      variationTheme: productData.variation_theme || null,
      availableVariations: productData.variants || null,

      // Related Products
      frequentlyBoughtTogether: frequently_bought_together || null,
      similarProducts: also_viewed || null,

      // Q&A
      questionCount: productData.questions?.total || 0,
      topQuestions: productData.questions?.results || null,

      // Raw data
      rawData: productData,
      lastFetchedAt: new Date(),
      fetchCount: 1,
      dataQuality: 100,
      needsRefresh: false,
    })
    .onConflictDoUpdate({
      target: [amazonProducts.asin],
      set: {
        title,
        price: buybox_winner?.price?.value?.toString() || null,
        rating: rating?.toString() || null,
        ratingsTotal: ratings_total || 0,
        isMyProduct,
        comparisonId,
        lastFetchedAt: new Date(),
        updatedAt: new Date(),
        rawData: productData,
      },
    })
    .returning();

  // Save images
  if (images && images.length > 0) {
    await db.delete(productImages).where(eq(productImages.asin, asin));

    const imageRecords = images.slice(0, 8).map((img: any, index: number) => ({
      asin,
      imageUrl: img.link,
      variant: (index === 0 ? "MAIN" : `PT0${index}`) as any,
      position: index,
      detectedAt: new Date(),
      isNew: true,
    }));

    await db.insert(productImages).values(imageRecords);
  }

  return productRecord[0];
}

// Simplifikovana funkcija - SAMO similar_to_consider
async function getRealRelatedProducts(
  productData: any,
  marketplace: string = "com",
  limit: number = 10
) {
  const competitors: any[] = [];
  const mainProduct = productData.product;

  console.log(`[RELATED] Looking for up to ${limit} related products...`);

  // 1. PRIORITY: Similar to Consider
  if (
    productData.similar_to_consider?.products &&
    productData.similar_to_consider.products.length > 0
  ) {
    console.log(
      `[RELATED] ✓ Found ${productData.similar_to_consider.products.length} from similar_to_consider`
    );

    const fromSimilar = productData.similar_to_consider.products
      .slice(0, limit)
      .map((item: any) => ({
        asin: item.asin,
        title: item.title,
        price: item.price?.value || 0,
        currency: item.price?.currency || "USD",
        rating: item.rating || 0,
        ratingsTotal: item.ratings_total || 0,
        imageUrl: item.image,
        link: item.link,
        brand: item.brand,
        source: "similar_to_consider",
      }));

    competitors.push(...fromSimilar);
  }

  // 2. FALLBACK: Also Viewed
  if (
    competitors.length < limit &&
    productData.also_viewed &&
    productData.also_viewed.length > 0
  ) {
    console.log(`[RELATED] Adding from also_viewed...`);
    const remaining = limit - competitors.length;

    const fromAlsoViewed = productData.also_viewed
      .slice(0, remaining)
      .map((item: any) => ({
        asin: item.asin,
        title: item.title,
        price: item.price?.value || 0,
        currency: item.price?.currency || "USD",
        rating: item.rating || 0,
        ratingsTotal: item.ratings_total || 0,
        imageUrl: item.image,
        link: item.link,
        brand: item.brand,
        source: "also_viewed",
      }));

    competitors.push(...fromAlsoViewed);
  }

  // 3. FALLBACK: Also Bought
  if (
    competitors.length < limit &&
    productData.also_bought &&
    productData.also_bought.length > 0
  ) {
    console.log(`[RELATED] Adding from also_bought...`);
    const remaining = limit - competitors.length;

    const fromAlsoBought = productData.also_bought
      .slice(0, remaining)
      .map((item: any) => ({
        asin: item.asin,
        title: item.title,
        price: item.price?.value || 0,
        currency: item.price?.currency || "USD",
        rating: item.rating || 0,
        ratingsTotal: item.ratings_total || 0,
        imageUrl: item.image,
        link: item.link,
        brand: item.brand,
        source: "also_bought",
      }));

    competitors.push(...fromAlsoBought);
  }

  // 4. FALLBACK: Frequently Bought Together
  if (
    competitors.length < limit &&
    productData.frequently_bought_together?.products &&
    productData.frequently_bought_together.products.length > 0
  ) {
    console.log(`[RELATED] Adding from frequently_bought_together...`);
    const remaining = limit - competitors.length;

    const fromFBT = productData.frequently_bought_together.products
      .filter((item: any) => item.asin !== mainProduct.asin)
      .slice(0, remaining)
      .map((item: any) => ({
        asin: item.asin,
        title: item.title,
        price: item.price?.value || 0,
        currency: item.price?.currency || "USD",
        rating: 0,
        ratingsTotal: 0,
        imageUrl: item.image,
        link: item.link,
        brand: null,
        source: "frequently_bought_together",
      }));

    competitors.push(...fromFBT);
  }

  // 5. LAST RESORT: Category search (samo ako ima manje od 3)
  if (competitors.length < 3) {
    console.log(`[RELATED] Less than 3 products, searching by category...`);
    try {
      const searchTerm =
        mainProduct.categories?.[0]?.name ||
        mainProduct.brand ||
        mainProduct.title.split(" ").slice(0, 3).join(" ");

      const searchResults = await fetchFromRainforest({
        type: "search",
        amazon_domain: `amazon.${marketplace}`,
        search_term: searchTerm,
        max_page: 1,
      });

      if (searchResults.search_results?.length > 0) {
        const remaining = limit - competitors.length;

        const fromSearch = searchResults.search_results
          .filter((item: any) => item.asin !== mainProduct.asin)
          .slice(0, remaining)
          .map((item: any) => ({
            asin: item.asin,
            title: item.title,
            price: item.price?.value || 0,
            currency: item.price?.currency || "USD",
            rating: item.rating || 0,
            ratingsTotal: item.ratings_total || 0,
            imageUrl: item.image,
            link: item.link,
            brand: item.brand,
            source: "category_search",
          }));

        competitors.push(...fromSearch);
      }
    } catch (error) {
      console.error("[RELATED] Category search failed:", error);
    }
  }

  // Calculate match scores
  const mainPrice = mainProduct.buybox_winner?.price?.value || 0;
  const mainRating = mainProduct.rating || 0;

  const scoredCompetitors = competitors.map((comp) => {
    let score = 50;

    if (comp.source === "similar_to_consider") score += 40;
    if (comp.source === "also_viewed") score += 30;
    if (comp.source === "also_bought") score += 25;
    if (comp.source === "frequently_bought_together") score += 20;
    if (comp.source === "category_search") score += 10;

    if (mainPrice > 0 && comp.price > 0) {
      const priceDiff = Math.abs(mainPrice - comp.price);
      const priceScore = Math.max(0, 25 - (priceDiff / mainPrice) * 50);
      score += priceScore;
    }

    if (mainRating > 0 && comp.rating > 0) {
      const ratingDiff = Math.abs(mainRating - comp.rating);
      const ratingScore = Math.max(0, 15 - ratingDiff * 15);
      score += ratingScore;
    }

    if (comp.brand && comp.brand === mainProduct.brand) {
      score += 10;
    }

    return { ...comp, score: Math.round(score) };
  });

  const finalCompetitors = scoredCompetitors.sort((a, b) => b.score - a.score);

  console.log(`[RELATED] Returning ${finalCompetitors.length} competitors`);
  console.log(`[RELATED] Sources:`, {
    similar_to_consider: finalCompetitors.filter(
      (c) => c.source === "similar_to_consider"
    ).length,
    also_viewed: finalCompetitors.filter((c) => c.source === "also_viewed")
      .length,
    also_bought: finalCompetitors.filter((c) => c.source === "also_bought")
      .length,
    frequently_bought_together: finalCompetitors.filter(
      (c) => c.source === "frequently_bought_together"
    ).length,
    category_search: finalCompetitors.filter(
      (c) => c.source === "category_search"
    ).length,
  });

  return finalCompetitors;
}

// Main API Route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      asin,
      marketplace = "com",
      folderId,
      skipRelatedProducts = false,
    } = body; // ← DODAJ skipRelatedProducts

    if (!asin || !folderId) {
      return NextResponse.json(
        { error: "ASIN and Folder ID required" },
        { status: 400 }
      );
    }

    console.log(`[FETCH] START: ${asin} in folder ${folderId}`);
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

    // 2. Fetch product from Rainforest
    console.log(`[FETCH] Fetching from Rainforest API...`);
    const productData = await fetchFromRainforest({
      type: "product",
      amazon_domain: `amazon.${marketplace}`,
      asin,
      similar_to_consider: "true",
      also_viewed: "true",
      also_bought: "true",
      frequently_bought_together: "true",
    });

    if (!productData.product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    console.log(
      `[FETCH] Product received with related items (${
        Date.now() - startTime
      }ms)`
    );

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
          name: `${productData.product.title.substring(0, 40)}... Analysis`,
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
          name: `${productData.product.title.substring(0, 40)}... Analysis`,
          marketplace: marketplace as any,
          status: "draft",
          createdBy: "system",
        })
        .returning();
    }

    // 4. Save MY PRODUCT with FULL data
    const savedProduct = await saveFullProductToDatabase(
      productData.product,
      marketplace,
      true,
      comparison.id
    );

    console.log(`[FETCH] My Product saved (${Date.now() - startTime}ms)`);

    // 5. Get REAL related products (only if NOT from search flow)
    let competitors: any[] = [];
    let stats: any = {
      competitorsFound: 0,
      processingTime: `${Date.now() - startTime}ms`,
      primarySource: "none",
      sources: {},
    };

    if (!skipRelatedProducts) {
      // ← SAMO AKO NIJE SEARCH FLOW
      competitors = await getRealRelatedProducts(productData, marketplace, 10);

      console.log(
        `[RELATED] Found ${competitors.length} related products (${
          Date.now() - startTime
        }ms)`
      );

      // Clear old competitors
      await db
        .delete(comparisonCompetitors)
        .where(eq(comparisonCompetitors.comparisonId, comparison.id));

      stats = {
        competitorsFound: competitors.length,
        processingTime: `${Date.now() - startTime}ms`,
        primarySource: competitors[0]?.source || "none",
        sources: {
          similar_to_consider: competitors.filter(
            (c) => c.source === "similar_to_consider"
          ).length,
          also_viewed: competitors.filter((c) => c.source === "also_viewed")
            .length,
          also_bought: competitors.filter((c) => c.source === "also_bought")
            .length,
          frequently_bought_together: competitors.filter(
            (c) => c.source === "frequently_bought_together"
          ).length,
          category_search: competitors.filter(
            (c) => c.source === "category_search"
          ).length,
        },
      };
    } else {
      console.log(`[FETCH] Skipping related products (search flow)`);
    }

    const totalTime = Date.now() - startTime;
    console.log(`[FETCH] COMPLETE in ${totalTime}ms`);

    // 7. Return response
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
        features: savedProduct.featureBullets,
        specifications: savedProduct.specifications,
        isPrime: savedProduct.isPrime,
        inStock: savedProduct.isInStock,
        bestsellerRank: savedProduct.bestsellerRank,
      },
      suggestedCompetitors: competitors, // Prazno ako je search flow
      stats,
      message: skipRelatedProducts
        ? `Product fetched successfully`
        : `Found ${competitors.length} related products`,
    });
  } catch (error: any) {
    console.error("[FETCH Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch product", details: error.message },
      { status: 500 }
    );
  }
}
