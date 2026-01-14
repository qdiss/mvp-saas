// lib/rainforest-helpers.ts
// ✅ FINAL FIX: Videos insert one-by-one to avoid SQL limits

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
    hasMainImage: !!data.product?.main_image?.link,
    imagesCount: data.product?.images?.length || 0,
    videosCount: data.product?.videos_count || 0,
  });

  return data;
}

/**
 * ✅ NEW: Extract and organize images properly
 */
export function extractImagesFromRainforest(productData: any) {
  // 1. Get main/hero image
  const mainImageUrl = productData.main_image?.link || null;

  // 2. Get all images from images array
  const allImages = productData.images || [];
  const imageLinks = allImages.map((img: any) => img.link);

  // 3. ✅ CRITICAL: Build imageUrls array with main image FIRST
  let imageUrls: string[] = [];

  if (mainImageUrl) {
    // Start with main image
    imageUrls.push(mainImageUrl);

    // Add other images (excluding main if it's already in the array)
    const otherImages = imageLinks.filter(
      (url: string) => url !== mainImageUrl
    );
    imageUrls.push(...otherImages);
  } else {
    // No main image, just use all images
    imageUrls = imageLinks;
  }

  // 4. Fallback to images_flat if array is empty
  if (imageUrls.length === 0 && productData.images_flat) {
    imageUrls = productData.images_flat.split(",").map((s: string) => s.trim());

    // If we got images from flat but no main image, use first one
    if (!mainImageUrl && imageUrls.length > 0) {
      return {
        mainImageUrl: imageUrls[0],
        imageUrls,
        images: allImages,
        imagesCount: imageUrls.length,
      };
    }
  }

  console.log(`[IMAGES] Extracted for ${productData.asin}:`, {
    mainImageUrl: mainImageUrl ? "✅" : "❌",
    imageUrlsCount: imageUrls.length,
    mainIsFirst: imageUrls[0] === mainImageUrl,
    firstImage: imageUrls[0]?.substring(0, 60),
  });

  return {
    mainImageUrl,
    imageUrls,
    images: allImages,
    imagesCount: imageUrls.length,
  };
}

/**
 * Extract videos from videos_additional field
 */
export function extractAllVideos(productData: any): any[] {
  const videos: any[] = [];

  console.log("[VIDEO EXTRACTION] Starting extraction for:", productData.asin);

  // ✅ Rainforest API stores videos in `videos_additional` field
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

  // Also try other locations
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

  console.log(`[VIDEO EXTRACTION] ✅ Total videos extracted: ${videos.length}`);

  return videos;
}

/**
 * Save product videos
 * ✅ FIXED: Insert one by one to avoid SQL parameter limits and handle duplicates
 */
export async function saveProductVideos(asin: string, videosData: any[]) {
  if (!videosData || videosData.length === 0) {
    console.log(`[VIDEOS] No videos for ${asin}`);
    return;
  }

  console.log(`[VIDEOS] Saving ${videosData.length} videos for ${asin}`);

  // Delete old videos
  await db.delete(productVideos).where(eq(productVideos.asin, asin));

  let savedCount = 0;
  let skippedCount = 0;

  // ✅ Insert videos ONE BY ONE to avoid SQL limits
  for (let index = 0; index < videosData.length; index++) {
    const video = videosData[index];

    try {
      const videoRecord = {
        videoId: video.id || `${asin}-${Date.now()}-${index}`,
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

      await db.insert(productVideos).values(videoRecord).onConflictDoNothing(); // ✅ Ignore duplicates

      savedCount++;
    } catch (error: any) {
      console.error(
        `[VIDEOS] ⚠️ Failed to save video ${index + 1}:`,
        error.message
      );
      skippedCount++;
    }
  }

  console.log(
    `[VIDEOS] ✅ Saved ${savedCount}/${videosData.length} videos (skipped: ${skippedCount})`
  );
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
 * ✅ FIXED: Save complete product with proper image handling
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

  // ✅ Extract images properly with main image first
  const imageData = extractImagesFromRainforest(productData);

  // Extract videos
  const extractedVideos = extractAllVideos(productData);

  console.log(`[SAVE ${isMyProduct ? "MY PRODUCT" : "COMPETITOR"}]`, {
    asin,
    title: title?.substring(0, 50),
    isMyProduct,
    mainImage: imageData.mainImageUrl ? "✅" : "❌",
    imageUrlsCount: imageData.imageUrls.length,
    mainIsFirst: imageData.imageUrls[0] === imageData.mainImageUrl,
    videosCount: extractedVideos.length,
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

      // ✅ Images - with main image first!
      mainImageUrl: imageData.mainImageUrl,
      imageUrls: imageData.imageUrls,
      imagesCount: imageData.imagesCount,
      has360View: has_360_view || false,

      // Videos
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

        // ✅ Update images too!
        mainImageUrl: imageData.mainImageUrl,
        imageUrls: imageData.imageUrls,
        imagesCount: imageData.imagesCount,

        hasVideo: extractedVideos.length > 0,
        hasAPlusContent: !!a_plus_content,
        aPlusModules: a_plus_content || null,
        rawData: productData,
        lastFetchedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning();

  console.log(`[SAVE] ✅ Product saved:`, {
    asin: productRecord.asin,
    mainImageUrl: productRecord.mainImageUrl ? "✅" : "❌",
    imageUrlsCount: productRecord.imageUrls?.length || 0,
    mainIsFirst: productRecord.imageUrls?.[0] === productRecord.mainImageUrl,
  });

  // 2. Save images to product_images table
  if (imageData.images && imageData.images.length > 0) {
    await saveProductImages(asin, imageData.images);
  }

  // 3. Save videos (with error handling now)
  if (extractedVideos.length > 0) {
    try {
      await saveProductVideos(asin, extractedVideos);
    } catch (error: any) {
      console.error(
        `[SAVE] ⚠️ Video save failed for ${asin}, but continuing:`,
        error.message
      );
      // Don't throw - let product be saved even if videos fail
    }
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
