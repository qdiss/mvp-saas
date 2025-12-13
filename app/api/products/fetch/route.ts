// app/api/products/fetch/route.ts
// FIXED: Označava "My Product", competitors u comparisonCompetitors, vraća SVE podatke

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
    const error = await response.text();
    throw new Error(`Rainforest API error: ${error}`);
  }

  return response.json();
}

// Spremi proizvod u bazu SA SVIM PODACIMA
async function saveProductToDatabase(
  productData: any,
  marketplace: string = "com",
  isMyProduct: boolean = false,
  comparisonId: string | null = null
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
    variants,
  } = productData;

  // KOMPLETAN INSERT SA SVIM POLJIMA
  const productRecord = await db
    .insert(amazonProducts)
    .values({
      asin: asin,
      marketplace: marketplace as any,
      title: title,
      brand: brand || null,
      link: link,

      // OZNAČAVANJE MY PRODUCT
      isMyProduct: isMyProduct,
      comparisonId: comparisonId,

      // Pricing - DETALJNO
      price: buybox_winner?.price?.value?.toString() || null,
      currency: buybox_winner?.price?.currency || "USD",
      priceSymbol: buybox_winner?.price?.symbol || "$",
      priceRaw: buybox_winner?.price?.raw || null,

      // RRP/List Price
      rrpValue: buybox_winner?.rrp?.value?.toString() || null,
      rrpRaw: buybox_winner?.rrp?.raw || null,

      // Savings
      savingsAmount: buybox_winner?.savings?.amount?.toString() || null,
      savingsPercent: buybox_winner?.savings?.percentage?.toString() || null,

      // Coupons & Deals
      hasCoupon: buybox_winner?.coupon?.badge ? true : false,
      couponText: buybox_winner?.coupon?.text || null,
      dealType: productData.deal_type || null,
      dealBadge: productData.deal_badge || null,

      // Ratings & Reviews
      rating: rating?.toString() || null,
      ratingsTotal: ratings_total || 0,
      reviewCount: ratings_total || 0,
      ratingBreakdown: productData.rating_breakdown || null,

      // Categories - KOMPLETAN
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

      // Bestseller Rank
      bestsellerRank: bestsellers_rank || null,
      bestsellerRankFlat: bestsellers_rank
        ? bestsellers_rank
            .map((r: any) => `#${r.rank} in ${r.category}`)
            .join(", ")
        : null,

      // Sales
      recentSales: productData.more_buying_choices?.[0]?.condition_note || null,

      // Images - SVE SLIKE
      mainImageUrl: main_image?.link || null,
      imageUrls: images?.map((img: any) => img.link) || [],
      imagesCount: images?.length || 0,
      has360View: productData.has_360_view || false,
      hasVideo: videos && videos.length > 0 ? true : false,

      // Features - SVE FEATURE BULLETS
      featureBullets: feature_bullets || [],
      featureBulletsCount: feature_bullets?.length || 0,
      featureBulletsFlat: feature_bullets ? feature_bullets.join(" ") : null,

      // Description
      description: description || null,
      descriptionHtml: productData.description_html || null,

      // Specifications - SVE SPECS
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
      itemVolume: productData.product_information?.item_volume || null,
      dateFirstAvailable: productData.product_information?.date_first_available
        ? new Date(productData.product_information.date_first_available)
        : null,

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

      // Seller Info
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
      hasVariations: variants && variants.length > 1,
      variationCount: variants?.length || 0,
      variationTheme: productData.variation_theme || null,
      availableVariations: variants || null,

      // Related Products
      frequentlyBoughtTogether: frequently_bought_together || null,
      similarProducts: also_viewed || null,

      // Q&A
      questionCount: productData.questions?.total || 0,
      topQuestions: productData.questions?.results || null,

      // KOMPLETAN RAW DATA
      rawData: productData,

      // Metadata
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
        isInStock: buybox_winner?.availability?.raw !== "Currently unavailable",
        isMyProduct: isMyProduct, // Update flag
        comparisonId: comparisonId, // Update comparison link
        lastFetchedAt: new Date(),
        updatedAt: new Date(),
        rawData: productData, // Update raw data
      },
    })
    .returning();

  // Spremi SVE SLIKE
  if (images && images.length > 0) {
    // Delete old images
    await db.delete(productImages).where(eq(productImages.asin, asin));

    // Insert new images
    const imageRecords = images.slice(0, 8).map((img: any, index: number) => ({
      asin: asin,
      imageUrl: img.link,
      variant: img.variant || ((index === 0 ? "MAIN" : `PT0${index}`) as any),
      position: index,
      detectedAt: new Date(),
      isNew: true,
    }));

    await db.insert(productImages).values(imageRecords);
  }

  return productRecord[0];
}

// Pronađi konkurente (also_viewed + fallback na category search)
async function findCompetitorsOptimized(
  mainProduct: any,
  marketplace: string = "com"
) {
  const competitors: any[] = [];

  // 1. Koristi also_viewed
  if (mainProduct.also_viewed && mainProduct.also_viewed.length > 0) {
    competitors.push(...mainProduct.also_viewed.slice(0, 10));
  }

  // 2. Koristi frequently_bought_together
  if (competitors.length < 10 && mainProduct.frequently_bought_together) {
    const remaining = 10 - competitors.length;
    competitors.push(
      ...mainProduct.frequently_bought_together.slice(0, remaining)
    );
  }

  // 3. FALLBACK: Ako nema dovoljno, search po kategoriji
  if (competitors.length < 5) {
    try {
      console.log(
        `[FETCH] Not enough competitors from also_viewed, searching by category...`
      );

      // Uzmi prvu kategoriju ili brand
      const searchTerm =
        mainProduct.categories?.[0]?.name ||
        mainProduct.brand ||
        mainProduct.title.split(" ").slice(0, 3).join(" ");

      const searchResults = await fetchFromRainforest({
        type: "search",
        amazon_domain: `amazon.${marketplace}`,
        search_term: searchTerm,
        max_page: 1, // Samo prva stranica
      });

      if (
        searchResults.search_results &&
        searchResults.search_results.length > 0
      ) {
        // Dodaj iz search results (exclude main product)
        const fromSearch = searchResults.search_results
          .filter((item: any) => item.asin !== mainProduct.asin)
          .slice(0, 10 - competitors.length);

        competitors.push(...fromSearch);
        console.log(
          `[FETCH] Added ${fromSearch.length} competitors from category search`
        );
      }
    } catch (error) {
      console.error("Error searching for competitors:", error);
    }
  }

  const scoredCompetitors = competitors.map((comp) => {
    let score = 50;

    const mainPrice = mainProduct.buybox_winner?.price?.value || 0;
    const compPrice = comp.price?.value || 0;

    if (mainPrice > 0 && compPrice > 0) {
      const priceDiff = Math.abs(mainPrice - compPrice);
      const priceScore = Math.max(0, 25 - (priceDiff / mainPrice) * 100);
      score += priceScore;
    }

    const mainRating = mainProduct.rating || 0;
    const compRating = comp.rating || 0;

    if (mainRating > 0 && compRating > 0) {
      const ratingDiff = Math.abs(mainRating - compRating);
      const ratingScore = Math.max(0, 15 - ratingDiff * 15);
      score += ratingScore;
    }

    if (comp.brand && comp.brand === mainProduct.brand) {
      score += 10;
    }

    return {
      asin: comp.asin,
      title: comp.title,
      price: compPrice,
      currency: comp.price?.currency || "USD",
      rating: compRating,
      ratingsTotal: comp.ratings_total || 0,
      imageUrl: comp.image,
      link: comp.link,
      brand: comp.brand,
      score: Math.round(score),
    };
  });

  return scoredCompetitors.sort((a, b) => b.score - a.score).slice(0, 10);
}

// Main API Route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asin, marketplace = "com", folderId } = body;

    if (!asin || !folderId) {
      return NextResponse.json(
        { error: "ASIN and Folder ID are required" },
        { status: 400 }
      );
    }

    console.log(`[FETCH] ASIN: ${asin}, Folder: ${folderId}`);
    const startTime = Date.now();

    // 1. Proveri folder
    const [folder] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, folderId))
      .limit(1);

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // 2. Fetch product sa Rainforest
    const productData = await fetchFromRainforest({
      type: "product",
      amazon_domain: `amazon.${marketplace}`,
      asin: asin,
    });

    if (!productData.product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    console.log(`[FETCH] Product data received (${Date.now() - startTime}ms)`);

    // 3. Kreiraj ili učitaj comparison
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
          updatedAt: new Date(),
        })
        .where(eq(comparisons.id, existingComparison.id))
        .returning();
    } else {
      [comparison] = await db
        .insert(comparisons)
        .values({
          folderId: folderId,
          primaryProductType: "competitor",
          primaryAsin: asin,
          name: folder.name, // KORISTI IME FOLDERA, ne menjaj ga
          marketplace: marketplace as any,
          status: "draft",
          createdBy: "system",
        })
        .returning();
    }

    // 4. Spremi GLAVNI PROIZVOD sa isMyProduct = TRUE
    const savedProduct = await saveProductToDatabase(
      productData.product,
      marketplace,
      true, // ← MY PRODUCT = TRUE
      comparison.id
    );

    console.log(`[FETCH] My Product saved: ${savedProduct.asin}`);

    // 5. Pronađi konkurente
    const competitors = await findCompetitorsOptimized(productData.product);
    console.log(`[FETCH] Found ${competitors.length} competitors`);

    // 6. Spremi konkurente sa isMyProduct = FALSE
    const savedCompetitors = [];

    for (const competitor of competitors) {
      try {
        // Proveri da li već postoji
        const existingProducts = await db
          .select()
          .from(amazonProducts)
          .where(
            and(
              eq(amazonProducts.asin, competitor.asin),
              eq(amazonProducts.isMyProduct, false)
            )
          )
          .limit(1);

        if (existingProducts.length === 0) {
          // Spremi sa isMyProduct = FALSE
          const saved = await db
            .insert(amazonProducts)
            .values({
              asin: competitor.asin,
              marketplace: marketplace as any,
              title: competitor.title,
              brand: competitor.brand || null,
              link: competitor.link,
              price: competitor.price?.toString() || null,
              currency: competitor.currency,
              rating: competitor.rating?.toString() || null,
              ratingsTotal: competitor.ratingsTotal,
              mainImageUrl: competitor.imageUrl,
              imageUrls: competitor.imageUrl ? [competitor.imageUrl] : [],
              isMyProduct: false, // ← COMPETITOR = FALSE
              comparisonId: comparison.id,
              lastFetchedAt: new Date(),
              fetchCount: 1,
              needsRefresh: true, // Može se fetchovati kasnije za full data
            })
            .returning();

          savedCompetitors.push(saved[0]);
        }
      } catch (error) {
        console.error(`Error saving competitor ${competitor.asin}:`, error);
      }
    }

    // 7. Dodaj konkurente u comparisonCompetitors tabelu
    await db
      .delete(comparisonCompetitors)
      .where(eq(comparisonCompetitors.comparisonId, comparison.id));

    if (competitors.length > 0) {
      const competitorRecords = competitors.map((comp, index) => ({
        comparisonId: comparison.id,
        asin: comp.asin,
        position: index,
        isVisible: true,
        matchScore: comp.score?.toString() || null,
        addedBy: "system",
      }));

      await db.insert(comparisonCompetitors).values(competitorRecords);
    }

    const totalTime = Date.now() - startTime;
    console.log(`[FETCH] Complete in ${totalTime}ms`);

    // 8. Return response
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

        // SVE DODATNE PODATKE
        features: savedProduct.featureBullets,
        specifications: savedProduct.specifications,
        description: savedProduct.description,
        isPrime: savedProduct.isPrime,
        inStock: savedProduct.isInStock,
        bestsellerRank: savedProduct.bestsellerRank,
        hasCoupon: savedProduct.hasCoupon,
        savingsAmount: savedProduct.savingsAmount,
      },
      suggestedCompetitors: competitors,
      stats: {
        competitorsFound: competitors.length,
        processingTime: `${totalTime}ms`,
        apiCallsMade: 1,
      },
      message: `Product saved as "My Product" with ${competitors.length} competitors`,
    });
  } catch (error: any) {
    console.error("[FETCH Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch product", details: error.message },
      { status: 500 }
    );
  }
}
