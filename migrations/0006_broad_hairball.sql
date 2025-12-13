ALTER TYPE "public"."image_variant" ADD VALUE 'PT08';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'rating_change';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'stock_change';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'new_review';--> statement-breakpoint
ALTER TYPE "public"."comparison_status" ADD VALUE 'archived';--> statement-breakpoint
ALTER TABLE "keyword_searches" ALTER COLUMN "comparison_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "savings_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "savings_percent" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "has_coupon" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "coupon_text" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "deal_type" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "deal_badge" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "price_history" jsonb;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "lowest_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "highest_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "last_price_change" timestamp;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "rating_history" jsonb;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "last_rating_change" timestamp;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "category_ids" text[];--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "category_breadcrumbs" text[];--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "rank_history" jsonb;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "lowest_rank" integer;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "last_rank_change" timestamp;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "estimated_monthly_sales" integer;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "has_video" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "feature_bullets_flat" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "description_html" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "specifications_flat" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "weight" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "size" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "stock_history" jsonb;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "last_stock_change" timestamp;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "prime_shipping_speed" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "has_free_returns" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "seller_name" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "seller_rating" numeric(3, 2);--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "seller_review_count" integer;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "a_plus_modules" jsonb;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "warranty_info" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "age_restriction" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "has_variations" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "variation_count" integer;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "variation_theme" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "available_variations" jsonb;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "similar_products" jsonb;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "competitor_asins" text[];--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "competitive_position" jsonb;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "question_count" integer;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "top_questions" jsonb;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "data_quality" integer DEFAULT 100;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "needs_refresh" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "refresh_priority" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "comparison_competitors" ADD COLUMN "match_score" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "keyword_searches" ADD COLUMN "folder_id" uuid;--> statement-breakpoint
ALTER TABLE "keyword_searches" ADD COLUMN "filters" jsonb;--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "detected_at" timestamp;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD COLUMN "total_votes" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD COLUMN "review_videos" text[];--> statement-breakpoint
CREATE INDEX "amazon_products_in_stock_idx" ON "amazon_products" USING btree ("is_in_stock");--> statement-breakpoint
CREATE INDEX "amazon_products_prime_idx" ON "amazon_products" USING btree ("is_prime");--> statement-breakpoint
CREATE INDEX "amazon_products_last_fetched_idx" ON "amazon_products" USING btree ("last_fetched_at");--> statement-breakpoint
CREATE INDEX "amazon_products_needs_refresh_idx" ON "amazon_products" USING btree ("needs_refresh");--> statement-breakpoint
CREATE INDEX "product_images_is_new_idx" ON "product_images" USING btree ("is_new");--> statement-breakpoint
CREATE INDEX "product_reviews_verified_idx" ON "product_reviews" USING btree ("verified_purchase");--> statement-breakpoint
CREATE INDEX "product_reviews_helpful_idx" ON "product_reviews" USING btree ("helpful_votes");