// lib/rainforest-helpers-final.ts
// ✅ FINAL FIX: Videos are in `videos_additional` field, not `videos`!

import { db } from "@/database/client";
import {
  amazonProducts,
  productImages,
  productVideos,
} from "@/database/schema";
import { eq } from "drizzle-orm";

/**
 * Fetch product data from Rainforest API
 */
export async function fetchFromRainforest(params: any) {
  const url = new URL("https://api.rainforestapi.com/request");
  url.searchParams.append("api_key", process.env.RAINFOREST_API_KEY!);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });

  console.log("[RAINFOREST] Request:", params);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Rainforest API error: ${response.statusText}`);
  }

  const data = await response.json();

  console.log("[RAINFOREST] Response:", {
    hasProduct: !!data.product,
    videosCount: data.product?.videos_count || 0,
    hasVideosAdditional: !!data.product?.videos_additional,
    videosAdditionalLength: data.product?.videos_additional?.length || 0,
  });

  return data;
}

/**
 * ✅ FIXED: Extract videos from videos_additional field
 */
export function extractAllVideos(productData: any): any[] {
  const videos: any[] = [];

  console.log("[VIDEO EXTRACTION] Starting extraction for:", productData.asin);
  console.log("[VIDEO EXTRACTION] videos_count:", productData.videos_count);
  console.log(
    "[VIDEO EXTRACTION] videos_additional:",
    !!productData.videos_additional
  );

  // ✅ FIX: Rainforest API stores videos in `videos_additional` field!
  if (
    productData.videos_additional &&
    Array.isArray(productData.videos_additional)
  ) {
    console.log(
      `[VIDEO EXTRACTION] ✅ Found ${productData.videos_additional.length} videos in 'videos_additional'`
    );
    videos.push(
      ...productData.videos_additional.map((v: any) => ({
        ...v,
        source: "videos_additional",
      }))
    );
  }

  // Also try other locations (just in case)
  if (productData.videos && Array.isArray(productData.videos)) {
    console.log(
      `[VIDEO EXTRACTION] Found ${productData.videos.length} videos in 'videos'`
    );
    videos.push(
      ...productData.videos.map((v: any) => ({
        ...v,
        source: "videos",
      }))
    );
  }

  if (productData.related_videos && Array.isArray(productData.related_videos)) {
    console.log(
      `[VIDEO EXTRACTION] Found ${productData.related_videos.length} videos in 'related_videos'`
    );
    videos.push(
      ...productData.related_videos.map((v: any) => ({
        ...v,
        source: "related_videos",
      }))
    );
  }

  console.log(`[VIDEO EXTRACTION] ✅ Total videos extracted: ${videos.length}`);

  return videos;
}

/**
 * Save product videos with proper field mapping for Rainforest structure
 */
export async function saveProductVideos(asin: string, videosData: any[]) {
  if (!videosData || videosData.length === 0) {
    console.log(`[VIDEOS] No videos for ${asin}`);
    return;
  }

  console.log(`[VIDEOS] Saving ${videosData.length} videos for ${asin}`);

  // Delete old videos
  await db.delete(productVideos).where(eq(productVideos.asin, asin));

  // Map Rainforest video structure to our schema
  const videoRecords = videosData.map((video, index) => {
    // Rainforest API structure:
    // - id: video ID
    // - video_url: main video URL
    // - video_image_url: thumbnail
    // - duration: duration string like "1:58"
    // - title: video title
    // - public_name: creator name
    // - profile_link: creator profile

    return {
      videoId: video.id || `${asin}-${Date.now()}-${Math.random()}`,
      asin,
      title: video.title || `Video ${index + 1}`,
      thumbnailUrl: video.video_image_url || video.thumbnail || null,
      videoUrl: video.video_url || video.url || null,
      duration: video.duration ? parseDuration(video.duration) : null,
      creatorType: video.vendor_code?.includes("influencer")
        ? "customer"
        : "brand",
      creatorName: video.public_name || video.vendor_name || null,
      creatorProfileUrl: video.profile_link || null,
      type: video.type === "videos_for_this_product" ? "hero" : "review",
      closedCaptions: video.closed_captions || null,
      createdAt: new Date(),
    };
  });

  await db.insert(productVideos).values(videoRecords);
  console.log(`[VIDEOS] ✅ Saved ${videoRecords.length} videos`);
}

/**
 * Parse duration string like "1:58" to seconds
 */
function parseDuration(duration: string): number | null {
  if (!duration) return null;

  const parts = duration.split(":");
  if (parts.length === 2) {
    const minutes = parseInt(parts[0]);
    const seconds = parseInt(parts[1]);
    return minutes * 60 + seconds;
  }

  return null;
}

/**
 * Save product images
 */
export async function saveProductImages(asin: string, imagesData: any[]) {
  if (!imagesData || imagesData.length === 0) {
    console.log(`[IMAGES] No images for ${asin}`);
    return;
  }

  console.log(`[IMAGES] Saving ${imagesData.length} images for ${asin}`);

  // Delete old images
  await db.delete(productImages).where(eq(productImages.asin, asin));

  // ✅ FIX: Type variant as enum values
  type ImageVariant =
    | "MAIN"
    | "PT01"
    | "PT02"
    | "PT03"
    | "PT04"
    | "PT05"
    | "PT06"
    | "PT07"
    | "PT08";

  const variantMap: Record<string, ImageVariant> = {
    MAIN: "MAIN",
    PT01: "PT01",
    PT02: "PT02",
    PT03: "PT03",
    PT04: "PT04",
    PT05: "PT05",
    PT06: "PT06",
    PT07: "PT07",
    PT08: "PT08",
  };

  const imageRecords = imagesData.map((img, index) => ({
    asin,
    imageUrl: img.link,
    variant: (variantMap[img.variant] || "MAIN") as ImageVariant,
    position: index,
    width: img.width || null,
    height: img.height || null,
    createdAt: new Date(),
  }));

  await db.insert(productImages).values(imageRecords);
  console.log(`[IMAGES] ✅ Saved ${imageRecords.length} images`);
}

/**
 * ✅ FIXED: Save complete product with video extraction from videos_additional
 */
export async function saveProductToDatabase(
  productData: any,
  marketplace: string,
  isMyProduct: boolean,
  comparisonId: string
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
    categories_flat,
    bestsellers_rank,
    specifications,
    buybox_winner,
    description,
    a_plus_content,
    videos_count,
    has_360_view,
    price,
    dimensions,
    weight,
    keywords,
    search_alias,
  } = productData;

  // ✅ Extract videos from videos_additional field
  const extractedVideos = extractAllVideos(productData);

  console.log(`[SAVE ${isMyProduct ? "MY PRODUCT" : "COMPETITOR"}]`, {
    asin,
    title: title?.substring(0, 50),
    isMyProduct,
    extractedVideosCount: extractedVideos.length,
    videosCount: videos_count,
    hasAPlusContent: !!a_plus_content,
    imagesCount: images?.length || 0,
  });

  // 1. Save main product record
  const [productRecord] = await db
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
      price:
        buybox_winner?.price?.value?.toString() ||
        price?.value?.toString() ||
        null,
      currency: buybox_winner?.price?.currency || price?.currency || "USD",
      priceSymbol: buybox_winner?.price?.symbol || price?.symbol || "$",
      priceRaw: buybox_winner?.price?.raw || price?.raw || null,
      rrpValue: buybox_winner?.rrp?.value?.toString() || null,
      rrpRaw: buybox_winner?.rrp?.raw || null,
      savingsAmount: buybox_winner?.savings?.amount?.toString() || null,
      savingsPercent: buybox_winner?.savings?.percentage?.toString() || null,
      unitPrice: buybox_winner?.unit_price || null,

      // Coupons
      hasCoupon: buybox_winner?.coupon?.badge_text ? true : false,
      couponText: buybox_winner?.coupon?.badge_text || null,

      // Ratings & Reviews
      rating: rating?.toString() || null,
      ratingsTotal: ratings_total || 0,
      reviewCount: ratings_total || 0,

      // Categories
      categories: categories || null,
      categoriesFlat:
        categories_flat ||
        (categories ? categories.map((c: any) => c.name).join(" > ") : null),
      searchAlias: search_alias?.name || null,
      searchAliasTitle: search_alias?.title || null,

      // Keywords
      keywords: keywords || null,
      keywordsList: keywords
        ? keywords.split(",").map((k: string) => k.trim())
        : null,

      // Bestseller Rank
      bestsellerRank: bestsellers_rank || null,

      // Images
      mainImageUrl: main_image?.link || null,
      imageUrls: images?.map((img: any) => img.link) || [],
      imagesCount: images?.length || 0,
      has360View: has_360_view || false,

      // Videos - use extracted count
      hasVideo: extractedVideos.length > 0,

      // Features
      featureBullets: feature_bullets || [],
      featureBulletsCount: feature_bullets?.length || 0,
      featureBulletsFlat: feature_bullets ? feature_bullets.join(" | ") : null,
      description: description || null,

      // Specifications
      specifications: specifications || null,

      // Dimensions & Weight
      dimensions: dimensions || null,
      weight: weight || null,

      // A+ Content
      hasAPlusContent: !!a_plus_content,
      aPlusModules: a_plus_content || null,
      hasBrandStory: a_plus_content?.brand_story ? true : false,

      // Availability
      isInStock: buybox_winner?.availability?.raw !== "Currently unavailable",
      availabilityType: buybox_winner?.availability?.type || null,
      availabilityRaw: buybox_winner?.availability?.raw || null,
      isPrime: buybox_winner?.is_prime || false,

      // Raw data
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
        isMyProduct,
        comparisonId,
        hasVideo: extractedVideos.length > 0,
        hasAPlusContent: !!a_plus_content,
        aPlusModules: a_plus_content || null,
        imagesCount: images?.length || 0,
        imageUrls: images?.map((img: any) => img.link) || [],
        rawData: productData,
        lastFetchedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning();

  console.log(
    `[SAVE ${isMyProduct ? "MY PRODUCT" : "COMPETITOR"}] ✅ Product saved:`,
    {
      asin: productRecord.asin,
      isMyProduct: productRecord.isMyProduct,
      hasVideo: productRecord.hasVideo,
      hasAPlusContent: productRecord.hasAPlusContent,
    }
  );

  // 2. Save images
  if (images && images.length > 0) {
    await saveProductImages(asin, images);
  }

  // 3. Save videos
  if (extractedVideos.length > 0) {
    await saveProductVideos(asin, extractedVideos);
  } else {
    console.log(`[VIDEOS] ⚠️ No videos found for ${asin}`);
  }

  return productRecord;
}

/**
 * Fetch complete product data
 */
export async function fetchCompleteProductData(
  asin: string,
  marketplace: string = "com"
) {
  const data = await fetchFromRainforest({
    type: "product",
    amazon_domain: `amazon.${marketplace}`,
    asin,
    videos: "true",
    video_count: 10,
    a_plus_body: "true",
    a_plus_third_party: "true",
  });

  return data.product;
}
