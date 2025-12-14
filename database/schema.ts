// database/schema.ts - KOMPLETNA FINALNA VERZIJA
import {
  pgTable,
  text,
  uuid,
  timestamp,
  decimal,
  integer,
  jsonb,
  pgEnum,
  boolean,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// ENUMS
// ============================================

export const rolesEnum = pgEnum("member_role", ["owner", "admin", "member"]);
export const statusEnum = pgEnum("comparison_status", [
  "draft",
  "in_progress",
  "completed",
  "archived",
]);
export const noteTypeEnum = pgEnum("note_type", [
  "general",
  "pros",
  "cons",
  "technical",
]);
export const permissionEnum = pgEnum("folder_permission", [
  "view",
  "edit",
  "admin",
]);
export const marketplaceEnum = pgEnum("marketplace", [
  "com",
  "co.uk",
  "de",
  "fr",
  "it",
  "es",
  "ca",
  "com.mx",
  "co.jp",
  "in",
  "com.br",
  "ae",
]);
export const productTypeEnum = pgEnum("product_type", [
  "my_product",
  "competitor",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "comment",
  "mention",
  "comparison_completed",
  "product_updated",
  "new_competitor_found",
  "price_change",
  "rating_change",
  "stock_change",
  "new_review",
]);
export const commentStatusEnum = pgEnum("comment_status", [
  "open",
  "resolved",
  "archived",
]);
export const imageVariantEnum = pgEnum("image_variant", [
  "MAIN",
  "PT01",
  "PT02",
  "PT03",
  "PT04",
  "PT05",
  "PT06",
  "PT07",
  "PT08",
]);

// ============================================
// CORE TABLES
// ============================================

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const organizationMembers = pgTable("organization_members", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  userId: text("user_id").notNull(),
  role: rolesEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const organizationMappings = pgTable("organization_mappings", {
  clerkOrgId: text("clerk_org_id").primaryKey(),
  internalOrgId: uuid("internal_org_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// FOLDERS
// ============================================

export const folders = pgTable(
  "folders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category").notNull(),
    color: text("color").default("#10b981"),
    icon: text("icon").default("Folder"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    orgIdx: index("folders_org_idx").on(table.organizationId),
    categoryIdx: index("folders_category_idx").on(table.category),
  })
);

// ============================================
// AMAZON PRODUCTS
// ============================================

export const amazonProducts = pgTable(
  "amazon_products",
  {
    // Primary identifiers
    asin: text("asin").primaryKey(),
    parentAsin: text("parent_asin"),
    marketplace: marketplaceEnum("marketplace").notNull().default("com"),

    // Basic product info
    title: text("title").notNull(),
    brand: text("brand"),
    link: text("link"),

    // Pricing
    price: decimal("price", { precision: 10, scale: 2 }),
    currency: text("currency").default("USD"),
    priceSymbol: text("price_symbol"),
    priceRaw: text("price_raw"),
    rrpValue: decimal("rrp_value", { precision: 10, scale: 2 }),
    rrpRaw: text("rrp_raw"),
    savingsAmount: decimal("savings_amount", { precision: 10, scale: 2 }),
    savingsPercent: decimal("savings_percent", { precision: 5, scale: 2 }),
    unitPrice: text("unit_price"),

    // Coupons & Deals
    hasCoupon: boolean("has_coupon").default(false),
    couponText: text("coupon_text"),
    dealType: text("deal_type"),
    dealBadge: text("deal_badge"),

    // Price tracking
    priceHistory: jsonb("price_history"),
    lowestPrice: decimal("lowest_price", { precision: 10, scale: 2 }),
    highestPrice: decimal("highest_price", { precision: 10, scale: 2 }),
    lastPriceChange: timestamp("last_price_change"),

    // Ratings & Reviews
    rating: decimal("rating", { precision: 3, scale: 2 }),
    ratingsTotal: integer("ratings_total"),
    reviewCount: integer("review_count"),
    ratingBreakdown: jsonb("rating_breakdown"),

    // Rating tracking
    ratingHistory: jsonb("rating_history"),
    lastRatingChange: timestamp("last_rating_change"),

    // Category & Classification
    searchAlias: text("search_alias"),
    searchAliasTitle: text("search_alias_title"),
    categories: jsonb("categories"),
    categoriesFlat: text("categories_flat"),
    categoryIds: text("category_ids").array(),
    categoryBreadcrumbs: text("category_breadcrumbs").array(),

    // Keywords & SEO
    keywords: text("keywords"),
    keywordsList: text("keywords_list").array(),

    // Bestseller rank
    bestsellerRank: jsonb("bestseller_rank"),
    bestsellerRankFlat: text("bestseller_rank_flat"),
    rankHistory: jsonb("rank_history"),
    lowestRank: integer("lowest_rank"),
    lastRankChange: timestamp("last_rank_change"),

    // Sales data
    recentSales: text("recent_sales"),
    estimatedMonthlySales: integer("estimated_monthly_sales"),

    // Images
    mainImageUrl: text("main_image_url"),
    imageUrls: text("image_urls").array(),
    imagesCount: integer("images_count"),
    has360View: boolean("has_360_view").default(false),
    hasVideo: boolean("has_video").default(false),

    // Features
    featureBullets: text("feature_bullets").array(),
    featureBulletsCount: integer("feature_bullets_count"),
    featureBulletsFlat: text("feature_bullets_flat"),
    description: text("description"),
    descriptionHtml: text("description_html"),

    // Specifications
    specifications: jsonb("specifications"),
    specificationsFlat: text("specifications_flat"),
    dimensions: text("dimensions"),
    weight: text("weight"),
    itemModelNumber: text("item_model_number"),
    manufacturer: text("manufacturer"),
    material: text("material"),
    color: text("color"),
    size: text("size"),
    itemVolume: text("item_volume"),
    dateFirstAvailable: timestamp("date_first_available"),

    // Availability & Fulfillment
    isInStock: boolean("is_in_stock").default(true),
    availabilityType: text("availability_type"),
    availabilityRaw: text("availability_raw"),
    dispatchDays: integer("dispatch_days"),
    stockHistory: jsonb("stock_history"),
    lastStockChange: timestamp("last_stock_change"),

    isPrime: boolean("is_prime").default(false),
    isPrimeExclusive: boolean("is_prime_exclusive").default(false),
    isFulfilledByAmazon: boolean("is_fulfilled_by_amazon").default(false),
    isSoldByAmazon: boolean("is_sold_by_amazon").default(false),
    isThirdParty: boolean("is_third_party").default(false),
    primeShippingSpeed: text("prime_shipping_speed"),
    hasFreeReturns: boolean("has_free_returns").default(false),

    // Seller info
    thirdPartySeller: jsonb("third_party_seller"),
    sellerName: text("seller_name"),
    sellerRating: decimal("seller_rating", { precision: 3, scale: 2 }),
    sellerReviewCount: integer("seller_review_count"),

    // Brand content
    hasAPlusContent: boolean("has_a_plus_content").default(false),
    aPlusModules: jsonb("a_plus_modules"),
    hasBrandStory: boolean("has_brand_story").default(false),
    brandStoreId: text("brand_store_id"),
    brandStoreLink: text("brand_store_link"),
    brandLogo: text("brand_logo"),
    brandDescription: text("brand_description"),

    // Compliance & Warnings
    isDiscontinued: boolean("is_discontinued").default(false),
    prop65Warning: boolean("prop65_warning").default(false),
    warrantyInfo: text("warranty_info"),
    ageRestriction: text("age_restriction"),

    // Bundles & Variations
    isBundle: boolean("is_bundle").default(false),
    isCollection: boolean("is_collection").default(false),
    hasVariations: boolean("has_variations").default(false),
    variationCount: integer("variation_count"),
    variationTheme: text("variation_theme"),
    availableVariations: jsonb("available_variations"),
    frequentlyBoughtTogether: jsonb("frequently_bought_together"),
    similarProducts: jsonb("similar_products"),

    // Competitive Intelligence
    competitorAsins: text("competitor_asins").array(),
    competitivePosition: jsonb("competitive_position"),

    // Q&A Data
    questionCount: integer("question_count"),
    topQuestions: jsonb("top_questions"),

    // Metadata & Tracking
    rawData: jsonb("raw_data"),
    lastFetchedAt: timestamp("last_fetched_at").defaultNow(),
    fetchCount: integer("fetch_count").default(1),
    dataQuality: integer("data_quality").default(100),
    needsRefresh: boolean("needs_refresh").default(false),
    refreshPriority: integer("refresh_priority").default(0),

    // MY PRODUCT FLAG
    isMyProduct: boolean("is_my_product").default(false),
    comparisonId: uuid("comparison_id"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    brandIdx: index("amazon_products_brand_idx").on(table.brand),
    categoryIdx: index("amazon_products_category_idx").on(table.searchAlias),
    marketplaceAsinIdx: unique("marketplace_asin_idx").on(
      table.marketplace,
      table.asin
    ),
    ratingIdx: index("amazon_products_rating_idx").on(table.rating),
    priceIdx: index("amazon_products_price_idx").on(table.price),
    inStockIdx: index("amazon_products_in_stock_idx").on(table.isInStock),
    primeIdx: index("amazon_products_prime_idx").on(table.isPrime),
    lastFetchedIdx: index("amazon_products_last_fetched_idx").on(
      table.lastFetchedAt
    ),
    needsRefreshIdx: index("amazon_products_needs_refresh_idx").on(
      table.needsRefresh
    ),
    isMyProductIdx: index("amazon_products_is_my_product_idx").on(
      table.isMyProduct
    ),
    comparisonIdIdx: index("amazon_products_comparison_id_idx").on(
      table.comparisonId
    ),
  })
);

// ============================================
// PRODUCT IMAGES
// ============================================

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    asin: text("asin").notNull(),
    imageUrl: text("image_url").notNull(),
    variant: imageVariantEnum("variant").default("MAIN"),
    width: integer("width"),
    height: integer("height"),
    isNew: boolean("is_new").default(false),
    detectedAt: timestamp("detected_at"),
    uploadedAt: timestamp("uploaded_at"),
    position: integer("position").default(0),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    asinIdx: index("product_images_asin_idx").on(table.asin),
    variantIdx: index("product_images_variant_idx").on(table.variant),
    isNewIdx: index("product_images_is_new_idx").on(table.isNew),
  })
);

// ============================================
// PRODUCT VIDEOS
// ============================================

export const productVideos = pgTable(
  "product_videos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    videoId: text("video_id").notNull().unique(),
    asin: text("asin").notNull(),
    title: text("title"),
    thumbnailUrl: text("thumbnail_url"),
    videoUrl: text("video_url"),
    duration: integer("duration"),
    creatorType: text("creator_type"),
    creatorName: text("creator_name"),
    creatorProfileUrl: text("creator_profile_url"),
    type: text("type"),
    closedCaptions: jsonb("closed_captions"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    asinIdx: index("product_videos_asin_idx").on(table.asin),
  })
);

// ============================================
// PRODUCT REVIEWS
// ============================================

export const productReviews = pgTable(
  "product_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reviewId: text("review_id").notNull().unique(),
    asin: text("asin").notNull(),
    title: text("title"),
    body: text("body"),
    bodyHtml: text("body_html"),
    rating: decimal("rating", { precision: 2, scale: 1 }),
    reviewDate: timestamp("review_date"),
    authorName: text("author_name"),
    authorProfileLink: text("author_profile_link"),
    authorProfileId: text("author_profile_id"),
    authorImageUrl: text("author_image_url"),
    verifiedPurchase: boolean("verified_purchase").default(false),
    vineProgram: boolean("vine_program").default(false),
    helpfulVotes: integer("helpful_votes").default(0),
    totalVotes: integer("total_votes").default(0),
    reviewCountry: text("review_country"),
    isGlobalReview: boolean("is_global_review").default(false),
    reviewImages: text("review_images").array(),
    reviewVideos: text("review_videos").array(),
    link: text("link"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    asinIdx: index("product_reviews_asin_idx").on(table.asin),
    ratingIdx: index("product_reviews_rating_idx").on(table.rating),
    dateIdx: index("product_reviews_date_idx").on(table.reviewDate),
    verifiedIdx: index("product_reviews_verified_idx").on(
      table.verifiedPurchase
    ),
    helpfulIdx: index("product_reviews_helpful_idx").on(table.helpfulVotes),
  })
);

// ============================================
// USER PRODUCTS
// ============================================

export const userProducts = pgTable(
  "user_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    folderId: uuid("folder_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }),
    currency: text("currency").default("USD"),
    brand: text("brand"),
    category: text("category"),
    rating: decimal("rating", { precision: 3, scale: 2 }),
    reviewCount: integer("review_count"),
    imageUrls: text("image_urls").array(),
    specifications: jsonb("specifications"),
    featureBullets: text("feature_bullets").array(),
    metadata: jsonb("metadata"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    folderIdx: index("user_products_folder_idx").on(table.folderId),
  })
);

// ============================================
// COMPARISONS
// ============================================

export const comparisons = pgTable(
  "comparisons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    folderId: uuid("folder_id").notNull(),
    primaryProductType: productTypeEnum("primary_product_type").notNull(),
    userProductId: uuid("user_product_id"),
    primaryAsin: text("primary_asin"),
    name: text("name").notNull(),
    description: text("description"),
    marketplace: marketplaceEnum("marketplace").default("com"),
    visibleColumns: text("visible_columns").array(),
    keyFeatures: jsonb("key_features"),
    comparisonData: jsonb("comparison_data"),
    insights: jsonb("insights"),
    status: statusEnum("status").default("draft"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    folderIdx: index("comparisons_folder_idx").on(table.folderId),
    statusIdx: index("comparisons_status_idx").on(table.status),
  })
);

// ============================================
// COMPARISON COMPETITORS
// ============================================

export const comparisonCompetitors = pgTable(
  "comparison_competitors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    comparisonId: uuid("comparison_id").notNull(),
    asin: text("asin").notNull(),
    position: integer("position").default(0),
    isVisible: boolean("is_visible").default(true),
    matchScore: decimal("match_score", { precision: 5, scale: 2 }),
    addedBy: text("added_by").notNull(),
    addedAt: timestamp("added_at").defaultNow(),
  },
  (table) => ({
    comparisonIdx: index("comparison_competitors_comparison_idx").on(
      table.comparisonId
    ),
    uniqueCompetitor: unique("unique_comparison_competitor").on(
      table.comparisonId,
      table.asin
    ),
  })
);

// ============================================
// IMAGE COMMENTS
// ============================================

// Dodaj novu tabelu za vezivanje komentara sa slikama
export const commentImages = pgTable(
  "comment_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    commentId: uuid("comment_id")
      .references(() => imageComments.id, { onDelete: "cascade" })
      .notNull(),
    imageUrl: text("image_url").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    commentIdx: index("comment_images_comment_idx").on(table.commentId),
    imageUrlIdx: index("comment_images_url_idx").on(table.imageUrl),
  })
);

// Ažuriraj imageComments tabelu - ukloni imageUrl odavde jer će biti u comment_images
export const imageComments = pgTable(
  "image_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    comparisonId: uuid("comparison_id").references(() => comparisons.id),
    content: text("content").notNull(),
    xPosition: decimal("x_position", { precision: 5, scale: 2 }),
    yPosition: decimal("y_position", { precision: 5, scale: 2 }),
    status: commentStatusEnum("status").default("open"),
    assignedTo: text("assigned_to"),
    dueDate: timestamp("due_date"),
    resolvedAt: timestamp("resolved_at"),
    resolvedBy: text("resolved_by"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    comparisonIdx: index("image_comments_comparison_idx").on(
      table.comparisonId
    ),
    statusIdx: index("image_comments_status_idx").on(table.status),
    assignedIdx: index("image_comments_assigned_idx").on(table.assignedTo),
  })
);

// ============================================
// FEATURE COMMENTS
// ============================================

export const featureComments = pgTable(
  "feature_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    comparisonId: uuid("comparison_id").notNull(),
    featureKey: text("feature_key").notNull(),
    productAsin: text("product_asin"),
    content: text("content").notNull(),
    status: commentStatusEnum("status").default("open"),
    assignedTo: text("assigned_to"),
    dueDate: timestamp("due_date"),
    resolvedAt: timestamp("resolved_at"),
    resolvedBy: text("resolved_by"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    comparisonIdx: index("feature_comments_comparison_idx").on(
      table.comparisonId
    ),
    featureIdx: index("feature_comments_feature_idx").on(table.featureKey),
    statusIdx: index("feature_comments_status_idx").on(table.status),
  })
);

// ============================================
// NOTIFICATIONS
// ============================================

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    organizationId: text("organization_id"),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message"),
    comparisonId: uuid("comparison_id"),
    commentId: uuid("comment_id"),
    productAsin: text("product_asin"),
    isRead: boolean("is_read").default(false),
    readAt: timestamp("read_at"),
    actionUrl: text("action_url"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userIdx: index("notifications_user_idx").on(table.userId),
    unreadIdx: index("notifications_unread_idx").on(table.userId, table.isRead),
    typeIdx: index("notifications_type_idx").on(table.type),
  })
);

// ============================================
// KEYWORD SEARCHES
// ============================================

export const keywordSearches = pgTable(
  "keyword_searches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    comparisonId: uuid("comparison_id"),
    folderId: uuid("folder_id"),
    keyword: text("keyword").notNull(),
    marketplace: marketplaceEnum("marketplace").default("com"),
    filters: jsonb("filters"),
    totalResults: integer("total_results"),
    avgRating: decimal("avg_rating", { precision: 3, scale: 2 }),
    medianRating: decimal("median_rating", { precision: 3, scale: 2 }),
    avgPrice: decimal("avg_price", { precision: 10, scale: 2 }),
    medianPrice: decimal("median_price", { precision: 10, scale: 2 }),
    priceRange: jsonb("price_range"),
    topAsins: text("top_asins").array(),
    searchedBy: text("searched_by").notNull(),
    searchedAt: timestamp("searched_at").defaultNow(),
  },
  (table) => ({
    comparisonIdx: index("keyword_searches_comparison_idx").on(
      table.comparisonId
    ),
    keywordIdx: index("keyword_searches_keyword_idx").on(table.keyword),
  })
);

// ============================================
// FOLDER SHARES
// ============================================

export const folderShares = pgTable(
  "folder_shares",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    folderId: uuid("folder_id").notNull(),
    sharedWithUserId: text("shared_with_user_id"),
    sharedWithTeamId: text("shared_with_team_id"),
    permission: permissionEnum("permission").default("view"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    folderIdx: index("folder_shares_folder_idx").on(table.folderId),
    userIdx: index("folder_shares_user_idx").on(table.sharedWithUserId),
  })
);

// ============================================
// RELATIONS
// ============================================

export const folderRelations = relations(folders, ({ many }) => ({
  userProducts: many(userProducts),
  comparisons: many(comparisons),
  shares: many(folderShares),
}));

export const amazonProductRelations = relations(amazonProducts, ({ many }) => ({
  images: many(productImages),
  videos: many(productVideos),
  reviews: many(productReviews),
  competitorIn: many(comparisonCompetitors),
}));

export const comparisonRelations = relations(comparisons, ({ many, one }) => ({
  competitors: many(comparisonCompetitors),
  notifications: many(notifications),
  keywordSearches: many(keywordSearches),
  imageComments: many(imageComments),
  featureComments: many(featureComments),
  folder: one(folders, {
    fields: [comparisons.folderId],
    references: [folders.id],
  }),
  userProduct: one(userProducts, {
    fields: [comparisons.userProductId],
    references: [userProducts.id],
  }),
}));

export const productImagesRelations = relations(
  productImages,
  ({ one, many }) => ({
    product: one(amazonProducts, {
      fields: [productImages.asin],
      references: [amazonProducts.asin],
    }),
    comments: many(imageComments),
  })
);

export const commentImagesRelations = relations(commentImages, ({ one }) => ({
  comment: one(imageComments, {
    fields: [commentImages.commentId],
    references: [imageComments.id],
  }),
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
  comparison: one(comparisons, {
    fields: [notifications.comparisonId],
    references: [comparisons.id],
  }),
}));
