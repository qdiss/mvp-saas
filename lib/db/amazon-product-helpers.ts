import { db } from "@/database/client";
import {
  amazonProducts,
  productImages,
  productVideos,
  productReviews,
  comparisonCompetitors,
  comparisons,
  notifications,
  imageComments,
  featureComments,
  keywordSearches,
} from "../../database/schema";
import { eq, and, inArray, desc, sql } from "drizzle-orm";

// ============================================
// 1. SAVE RAINFOREST API RESPONSE
// ============================================

export async function saveAmazonProduct(
  apiResponse: any,
  marketplace: string = "com"
) {
  const product = apiResponse.product;

  // Main product record
  const [savedProduct] = await db
    .insert(amazonProducts)
    .values({
      asin: product.asin,
      parentAsin: product.parent_asin,
      marketplace,

      // Basic info
      title: product.title,
      brand: product.brand,
      link: product.link,

      // Pricing
      price: product.buybox_winner?.price?.value,
      currency: product.buybox_winner?.price?.currency,
      priceSymbol: product.buybox_winner?.price?.symbol,
      priceRaw: product.buybox_winner?.price?.raw,
      rrpValue: product.buybox_winner?.rrp?.value,
      rrpRaw: product.buybox_winner?.rrp?.raw,
      unitPrice: product.buybox_winner?.unit_price?.raw,

      // Ratings
      rating: product.rating,
      ratingsTotal: product.ratings_total,
      reviewCount: product.ratings_total,
      ratingBreakdown: product.rating_breakdown,

      // Category
      searchAlias: product.search_alias?.value,
      searchAliasTitle: product.search_alias?.title,
      categories: product.categories,
      categoriesFlat: product.categories_flat,

      // Keywords
      keywords: product.keywords,
      keywordsList: product.keywords_list,

      // Bestseller
      bestsellerRank: apiResponse.bestsellers_rank,
      bestsellerRankFlat: apiResponse.bestsellers_rank_flat,

      // Sales
      recentSales: product.recent_sales,

      // Images
      mainImageUrl: product.main_image?.link,
      imageUrls: product.images?.map((img: any) => img.link),
      imagesCount: product.images_count,
      has360View: product.has_360_view,

      // Features
      featureBullets: product.feature_bullets,
      featureBulletsCount: product.feature_bullets_count,
      description: product.description,

      // Specifications
      specifications: apiResponse.specifications,
      dimensions: apiResponse.specifications?.find(
        (s: any) => s.name === "Product Dimensions"
      )?.value,
      itemModelNumber: product.specifications?.item_model_number,
      manufacturer: apiResponse.specifications?.find(
        (s: any) => s.name === "Manufacturer"
      )?.value,
      material: apiResponse.specifications?.find(
        (s: any) => s.name === "Material"
      )?.value,
      itemVolume: apiResponse.specifications?.find(
        (s: any) => s.name === "Item Volume"
      )?.value,
      dateFirstAvailable: apiResponse.specifications?.first_available?.utc,

      // Availability
      isInStock: product.buybox_winner?.availability?.type === "in_stock",
      availabilityType: product.buybox_winner?.availability?.type,
      availabilityRaw: product.buybox_winner?.availability?.raw,
      dispatchDays: product.buybox_winner?.availability?.dispatch_days,
      isPrime: product.buybox_winner?.is_prime,
      isPrimeExclusive: product.buybox_winner?.is_prime_exclusive_deal,
      isFulfilledByAmazon:
        product.buybox_winner?.fulfillment?.is_fulfilled_by_amazon,
      isSoldByAmazon: product.buybox_winner?.fulfillment?.is_sold_by_amazon,
      isThirdParty: product.third_party,

      // Seller
      thirdPartySeller: product.buybox_winner?.fulfillment?.third_party_seller,

      // Brand content
      hasAPlusContent: product.a_plus_content?.has_a_plus_content,
      hasBrandStory: product.a_plus_content?.has_brand_story,
      brandStoreId:
        product.a_plus_content?.brand_story?.brand_store?.id ||
        apiResponse.brand_store?.id,
      brandStoreLink:
        product.a_plus_content?.brand_story?.brand_store?.link ||
        apiResponse.brand_store?.link,
      brandLogo: product.a_plus_content?.brand_story?.brand_logo,
      brandDescription: product.a_plus_content?.brand_story?.description,

      // Compliance
      isDiscontinued:
        apiResponse.specifications?.find(
          (s: any) => s.name === "Is Discontinued By Manufacturer"
        )?.value === "Yes",
      prop65Warning: product.proposition_65_warning,

      // Bundles
      isBundle: product.is_bundle,
      isCollection: product.is_collection,
      frequentlyBoughtTogether: apiResponse.frequently_bought_together,

      // Raw data for future use
      rawData: apiResponse,
      lastFetchedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [amazonProducts.asin, amazonProducts.marketplace],
      set: {
        // Update key fields on re-fetch
        price: sql`excluded.price`,
        rating: sql`excluded.rating`,
        ratingsTotal: sql`excluded.ratings_total`,
        isInStock: sql`excluded.is_in_stock`,
        lastFetchedAt: sql`excluded.last_fetched_at`,
        fetchCount: sql`${amazonProducts.fetchCount} + 1`,
        updatedAt: new Date(),
      },
    })
    .returning();

  // Save images
  if (product.images && product.images.length > 0) {
    const imageData = product.images.map((img: any, idx: number) => ({
      asin: product.asin,
      imageUrl: img.link,
      variant: img.variant || "MAIN",
      position: idx,
      isNew: false, // Set to true if image wasn't in DB before
    }));

    await db.insert(productImages).values(imageData).onConflictDoNothing();
  }

  // Save videos
  if (
    apiResponse.videos_additional &&
    apiResponse.videos_additional.length > 0
  ) {
    const videoData = apiResponse.videos_additional.map((vid: any) => ({
      videoId: vid.id,
      asin: product.asin,
      title: vid.title,
      thumbnailUrl: vid.video_image_url,
      videoUrl: vid.video_url,
      duration: vid.duration,
      creatorType: vid.creator_type,
      creatorName: vid.public_name || vid.vendor_name,
      creatorProfileUrl: vid.profile_link,
      type: vid.type,
      closedCaptions: vid.closed_captions,
    }));

    await db.insert(productVideos).values(videoData).onConflictDoNothing();
  }

  // Save top reviews
  if (apiResponse.top_reviews && apiResponse.top_reviews.length > 0) {
    const reviewData = apiResponse.top_reviews.map((review: any) => ({
      reviewId: review.id,
      asin: product.asin,
      title: review.title,
      body: review.body,
      bodyHtml: review.body_html,
      rating: review.rating,
      reviewDate: review.date?.utc ? new Date(review.date.utc) : null,
      authorName: review.profile?.name,
      authorProfileLink: review.profile?.link,
      authorProfileId: review.profile?.id,
      authorImageUrl: review.profile?.image,
      verifiedPurchase: review.verified_purchase,
      vineProgram: review.vine_program,
      helpfulVotes: review.helpful_votes,
      reviewCountry: review.review_country,
      isGlobalReview: review.is_global_review,
      reviewImages: review.images,
      link: review.link,
    }));

    await db.insert(productReviews).values(reviewData).onConflictDoNothing();
  }

  return savedProduct;
}

// ============================================
// 2. CREATE COMPARISON
// ============================================

export async function createComparison({
  folderId,
  name,
  primaryAsin,
  competitorAsins = [],
  marketplace = "com",
  userId,
}: {
  folderId: string;
  name: string;
  primaryAsin: string;
  competitorAsins?: string[];
  marketplace?: string;
  userId: string;
}) {
  // Create comparison
  const [comparison] = await db
    .insert(comparisons)
    .values({
      folderId,
      name,
      primaryProductType: "competitor", // Assuming Amazon product
      primaryAsin,
      marketplace,
      visibleColumns: ["price", "rating", "reviews", "images"],
      status: "in_progress",
      createdBy: userId,
    })
    .returning();

  // Add competitors
  if (competitorAsins.length > 0) {
    const competitorData = competitorAsins.map((asin, idx) => ({
      comparisonId: comparison.id,
      asin,
      position: idx + 1,
      addedBy: userId,
    }));

    await db.insert(comparisonCompetitors).values(competitorData);
  }

  // Create notification
  await db.insert(notifications).values({
    userId,
    type: "comparison_completed",
    title: "New comparison created",
    message: `Comparison "${name}" has been created`,
    comparisonId: comparison.id,
    actionUrl: `/folders/${folderId}/comparison/${comparison.id}`,
  });

  return comparison;
}

// ============================================
// 3. ADD COMPETITOR TO COMPARISON
// ============================================

export async function addCompetitorToComparison({
  comparisonId,
  asin,
  userId,
}: {
  comparisonId: string;
  asin: string;
  userId: string;
}) {
  // Get max position
  const maxPosition = await db
    .select({
      max: sql<number>`COALESCE(MAX(${comparisonCompetitors.position}), 0)`,
    })
    .from(comparisonCompetitors)
    .where(eq(comparisonCompetitors.comparisonId, comparisonId));

  const [competitor] = await db
    .insert(comparisonCompetitors)
    .values({
      comparisonId,
      asin,
      position: (maxPosition[0]?.max || 0) + 1,
      addedBy: userId,
    })
    .returning();

  // Notify other users
  const comparison = await db.query.comparisons.findFirst({
    where: eq(comparisons.id, comparisonId),
  });

  if (comparison) {
    await db.insert(notifications).values({
      userId: comparison.createdBy,
      type: "new_competitor_found",
      title: "New competitor added",
      message: `A new competitor (${asin}) was added to comparison`,
      comparisonId,
      productAsin: asin,
    });
  }

  return competitor;
}

// ============================================
// 4. IMAGE COMMENTS
// ============================================

export async function createImageComment({
  imageId,
  comparisonId,
  content,
  xPosition,
  yPosition,
  assignedTo,
  dueDate,
  userId,
}: {
  imageId: string;
  comparisonId?: string;
  content: string;
  xPosition: number;
  yPosition: number;
  assignedTo?: string;
  dueDate?: Date;
  userId: string;
}) {
  const [comment] = await db
    .insert(imageComments)
    .values({
      imageId,
      comparisonId,
      content,
      xPosition: xPosition.toString(),
      yPosition: yPosition.toString(),
      assignedTo,
      dueDate,
      createdBy: userId,
    })
    .returning();

  // Create notification for assigned user
  if (assignedTo && assignedTo !== userId) {
    await db.insert(notifications).values({
      userId: assignedTo,
      type: "comment",
      title: "You've been assigned a comment",
      message: content.substring(0, 100),
      commentId: comment.id,
      comparisonId,
    });
  }

  return comment;
}

export async function resolveImageComment(commentId: string, userId: string) {
  await db
    .update(imageComments)
    .set({
      status: "resolved",
      resolvedAt: new Date(),
      resolvedBy: userId,
    })
    .where(eq(imageComments.id, commentId));
}

// ============================================
// 5. FEATURE COMPARISON COMMENTS
// ============================================

export async function createFeatureComment({
  comparisonId,
  featureKey,
  productAsin,
  content,
  assignedTo,
  userId,
}: {
  comparisonId: string;
  featureKey: string;
  productAsin?: string;
  content: string;
  assignedTo?: string;
  userId: string;
}) {
  const [comment] = await db
    .insert(featureComments)
    .values({
      comparisonId,
      featureKey,
      productAsin,
      content,
      assignedTo,
      createdBy: userId,
    })
    .returning();

  if (assignedTo && assignedTo !== userId) {
    await db.insert(notifications).values({
      userId: assignedTo,
      type: "comment",
      title: `Comment on ${featureKey}`,
      message: content.substring(0, 100),
      commentId: comment.id,
      comparisonId,
    });
  }

  return comment;
}

// ============================================
// 6. KEYWORD SEARCH WITH AGGREGATION
// ============================================

export async function searchCompetitorsByKeyword({
  comparisonId,
  keyword,
  marketplace = "com",
  userId,
}: {
  comparisonId: string;
  keyword: string;
  marketplace?: string;
  userId: string;
}) {
  // This would call Rainforest API search endpoint
  // For now, showing how to save the results

  // Simulate API call results
  const searchResults = {
    totalResults: 150,
    avgRating: 4.3,
    avgPrice: 29.99,
    priceRange: { min: 9.99, max: 79.99 },
    topAsins: ["B08X...", "B07Y...", "B09Z..."], // Top results
  };

  // Save search
  await db.insert(keywordSearches).values({
    comparisonId,
    keyword,
    marketplace,
    totalResults: searchResults.totalResults,
    avgRating: searchResults.avgRating.toString(),
    avgPrice: searchResults.avgPrice.toString(),
    priceRange: searchResults.priceRange,
    topAsins: searchResults.topAsins,
    searchedBy: userId,
  });

  return searchResults;
}

// ============================================
// 7. GET UNREAD NOTIFICATIONS COUNT
// ============================================

export async function getUnreadNotificationsCount(userId: string) {
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    );

  return result[0]?.count || 0;
}

// ============================================
// 8. GET UNREAD COMMENTS COUNT PER COMPARISON
// ============================================

export async function getUnreadCommentsForComparison(
  comparisonId: string,
  userId: string
) {
  // Get all image comments
  const imageCommentCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(imageComments)
    .where(
      and(
        eq(imageComments.comparisonId, comparisonId),
        eq(imageComments.status, "open"),
        sql`${imageComments.createdBy} != ${userId}` // Not created by current user
      )
    );

  // Get all feature comments
  const featureCommentCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(featureComments)
    .where(
      and(
        eq(featureComments.comparisonId, comparisonId),
        eq(featureComments.status, "open"),
        sql`${featureComments.createdBy} != ${userId}`
      )
    );

  return {
    imageComments: imageCommentCount[0]?.count || 0,
    featureComments: featureCommentCount[0]?.count || 0,
    total:
      (imageCommentCount[0]?.count || 0) + (featureCommentCount[0]?.count || 0),
  };
}

// ============================================
// 9. MARK "NEW" IMAGES
// ============================================

export async function markNewImages(asin: string) {
  // Get existing image URLs
  const existing = await db.query.productImages.findMany({
    where: eq(productImages.asin, asin),
    columns: { imageUrl: true },
  });

  const existingUrls = new Set(existing.map((img) => img.imageUrl));

  // Get latest product data
  const product = await db.query.amazonProducts.findFirst({
    where: eq(amazonProducts.asin, asin),
  });

  if (!product?.imageUrls) return [];

  // Find new images
  const newImages = product.imageUrls.filter((url) => !existingUrls.has(url));

  if (newImages.length > 0) {
    // Mark them as new
    await db
      .update(productImages)
      .set({ isNew: true })
      .where(
        and(
          eq(productImages.asin, asin),
          inArray(productImages.imageUrl, newImages)
        )
      );
  }

  return newImages;
}

// ============================================
// 10. SEARCH PRODUCTS WITH FILTERS
// ============================================

export async function searchProducts({
  keyword,
  minRating,
  maxPrice,
  minPrice,
  category,
  marketplace = "com",
  limit = 20,
}: {
  keyword?: string;
  minRating?: number;
  maxPrice?: number;
  minPrice?: number;
  category?: string;
  marketplace?: string;
  limit?: number;
}) {
  let query = db.select().from(amazonProducts);

  const conditions = [eq(amazonProducts.marketplace, marketplace)];

  if (keyword) {
    conditions.push(
      sql`${amazonProducts.title} ILIKE ${`%${keyword}%`} OR ${
        amazonProducts.keywords
      } ILIKE ${`%${keyword}%`}`
    );
  }

  if (minRating) {
    conditions.push(sql`${amazonProducts.rating} >= ${minRating}`);
  }

  if (maxPrice) {
    conditions.push(sql`${amazonProducts.price} <= ${maxPrice}`);
  }

  if (minPrice) {
    conditions.push(sql`${amazonProducts.price} >= ${minPrice}`);
  }

  if (category) {
    conditions.push(eq(amazonProducts.searchAlias, category));
  }

  const results = await query
    .where(and(...conditions))
    .orderBy(desc(amazonProducts.rating))
    .limit(limit);

  return results;
}

// ============================================
// 11. GET FULL COMPARISON WITH ALL DATA
// ============================================

export async function getFullComparison(comparisonId: string) {
  const comparison = await db.query.comparisons.findFirst({
    where: eq(comparisons.id, comparisonId),
    with: {
      competitors: {
        with: {
          product: {
            with: {
              images: true,
              videos: true,
              reviews: {
                orderBy: [desc(productReviews.helpfulVotes)],
                limit: 5,
              },
            },
          },
        },
      },
      imageComments: {
        where: eq(imageComments.status, "open"),
      },
      featureComments: {
        where: eq(featureComments.status, "open"),
      },
    },
  });

  return comparison;
}
