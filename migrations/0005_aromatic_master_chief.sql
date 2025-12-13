CREATE TYPE "public"."comment_status" AS ENUM('open', 'resolved', 'archived');--> statement-breakpoint
CREATE TYPE "public"."image_variant" AS ENUM('MAIN', 'PT01', 'PT02', 'PT03', 'PT04', 'PT05', 'PT06', 'PT07');--> statement-breakpoint
CREATE TYPE "public"."marketplace" AS ENUM('com', 'co.uk', 'de', 'fr', 'it', 'es', 'ca', 'com.mx', 'co.jp', 'in', 'com.br', 'ae');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('comment', 'mention', 'comparison_completed', 'product_updated', 'new_competitor_found', 'price_change');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('my_product', 'competitor');--> statement-breakpoint
CREATE TABLE "comparison_competitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comparison_id" uuid NOT NULL,
	"asin" text NOT NULL,
	"position" integer DEFAULT 0,
	"is_visible" boolean DEFAULT true,
	"added_by" text NOT NULL,
	"added_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_comparison_competitor" UNIQUE("comparison_id","asin")
);
--> statement-breakpoint
CREATE TABLE "feature_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comparison_id" uuid NOT NULL,
	"feature_key" text NOT NULL,
	"product_asin" text,
	"content" text NOT NULL,
	"status" "comment_status" DEFAULT 'open',
	"assigned_to" text,
	"due_date" timestamp,
	"resolved_at" timestamp,
	"resolved_by" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "image_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_id" uuid NOT NULL,
	"comparison_id" uuid,
	"content" text NOT NULL,
	"x_position" numeric(5, 2),
	"y_position" numeric(5, 2),
	"status" "comment_status" DEFAULT 'open',
	"assigned_to" text,
	"due_date" timestamp,
	"resolved_at" timestamp,
	"resolved_by" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "keyword_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comparison_id" uuid NOT NULL,
	"keyword" text NOT NULL,
	"marketplace" "marketplace" DEFAULT 'com',
	"total_results" integer,
	"avg_rating" numeric(3, 2),
	"avg_price" numeric(10, 2),
	"price_range" jsonb,
	"top_asins" text[],
	"searched_by" text NOT NULL,
	"searched_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text,
	"comparison_id" uuid,
	"comment_id" uuid,
	"product_asin" text,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"action_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asin" text NOT NULL,
	"image_url" text NOT NULL,
	"variant" "image_variant" DEFAULT 'MAIN',
	"width" integer,
	"height" integer,
	"is_new" boolean DEFAULT false,
	"uploaded_at" timestamp,
	"position" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" text NOT NULL,
	"asin" text NOT NULL,
	"title" text,
	"body" text,
	"body_html" text,
	"rating" numeric(2, 1),
	"review_date" timestamp,
	"author_name" text,
	"author_profile_link" text,
	"author_profile_id" text,
	"author_image_url" text,
	"verified_purchase" boolean DEFAULT false,
	"vine_program" boolean DEFAULT false,
	"helpful_votes" integer DEFAULT 0,
	"review_country" text,
	"is_global_review" boolean DEFAULT false,
	"review_images" text[],
	"link" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "product_reviews_review_id_unique" UNIQUE("review_id")
);
--> statement-breakpoint
CREATE TABLE "product_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" text NOT NULL,
	"asin" text NOT NULL,
	"title" text,
	"thumbnail_url" text,
	"video_url" text,
	"duration" integer,
	"creator_type" text,
	"creator_name" text,
	"creator_profile_url" text,
	"type" text,
	"closed_captions" jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "product_videos_video_id_unique" UNIQUE("video_id")
);
--> statement-breakpoint
ALTER TABLE "comparison_messages" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "comparison_notes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "images" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "comparison_messages" CASCADE;--> statement-breakpoint
DROP TABLE "comparison_notes" CASCADE;--> statement-breakpoint
DROP TABLE "images" CASCADE;--> statement-breakpoint
ALTER TABLE "amazon_products" ALTER COLUMN "currency" SET DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "parent_asin" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "marketplace" "marketplace" DEFAULT 'com' NOT NULL;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "link" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "price_symbol" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "price_raw" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "rrp_value" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "rrp_raw" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "unit_price" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "ratings_total" integer;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "rating_breakdown" jsonb;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "search_alias" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "search_alias_title" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "categories" jsonb;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "categories_flat" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "keywords" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "keywords_list" text[];--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "bestseller_rank" jsonb;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "bestseller_rank_flat" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "recent_sales" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "main_image_url" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "images_count" integer;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "has_360_view" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "feature_bullets" text[];--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "feature_bullets_count" integer;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "dimensions" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "item_model_number" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "manufacturer" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "material" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "item_volume" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "date_first_available" timestamp;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "is_in_stock" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "availability_type" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "availability_raw" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "dispatch_days" integer;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "is_prime" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "is_prime_exclusive" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "is_fulfilled_by_amazon" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "is_sold_by_amazon" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "is_third_party" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "third_party_seller" jsonb;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "has_a_plus_content" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "has_brand_story" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "brand_store_id" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "brand_store_link" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "brand_logo" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "brand_description" text;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "is_discontinued" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "prop65_warning" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "is_bundle" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "is_collection" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "frequently_bought_together" jsonb;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "fetch_count" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "comparisons" ADD COLUMN "primary_product_type" "product_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "comparisons" ADD COLUMN "primary_asin" text;--> statement-breakpoint
ALTER TABLE "comparisons" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "comparisons" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "comparisons" ADD COLUMN "marketplace" "marketplace" DEFAULT 'com';--> statement-breakpoint
ALTER TABLE "comparisons" ADD COLUMN "visible_columns" text[];--> statement-breakpoint
ALTER TABLE "comparisons" ADD COLUMN "key_features" jsonb;--> statement-breakpoint
ALTER TABLE "comparisons" ADD COLUMN "insights" jsonb;--> statement-breakpoint
ALTER TABLE "user_products" ADD COLUMN "rating" numeric(3, 2);--> statement-breakpoint
ALTER TABLE "user_products" ADD COLUMN "review_count" integer;--> statement-breakpoint
ALTER TABLE "user_products" ADD COLUMN "image_urls" text[];--> statement-breakpoint
ALTER TABLE "user_products" ADD COLUMN "feature_bullets" text[];--> statement-breakpoint
CREATE INDEX "comparison_competitors_comparison_idx" ON "comparison_competitors" USING btree ("comparison_id");--> statement-breakpoint
CREATE INDEX "feature_comments_comparison_idx" ON "feature_comments" USING btree ("comparison_id");--> statement-breakpoint
CREATE INDEX "feature_comments_feature_idx" ON "feature_comments" USING btree ("feature_key");--> statement-breakpoint
CREATE INDEX "feature_comments_status_idx" ON "feature_comments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "image_comments_image_idx" ON "image_comments" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "image_comments_comparison_idx" ON "image_comments" USING btree ("comparison_id");--> statement-breakpoint
CREATE INDEX "image_comments_status_idx" ON "image_comments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "image_comments_assigned_idx" ON "image_comments" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "keyword_searches_comparison_idx" ON "keyword_searches" USING btree ("comparison_id");--> statement-breakpoint
CREATE INDEX "keyword_searches_keyword_idx" ON "keyword_searches" USING btree ("keyword");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_unread_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "product_images_asin_idx" ON "product_images" USING btree ("asin");--> statement-breakpoint
CREATE INDEX "product_images_variant_idx" ON "product_images" USING btree ("variant");--> statement-breakpoint
CREATE INDEX "product_reviews_asin_idx" ON "product_reviews" USING btree ("asin");--> statement-breakpoint
CREATE INDEX "product_reviews_rating_idx" ON "product_reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "product_reviews_date_idx" ON "product_reviews" USING btree ("review_date");--> statement-breakpoint
CREATE INDEX "product_videos_asin_idx" ON "product_videos" USING btree ("asin");--> statement-breakpoint
CREATE INDEX "amazon_products_brand_idx" ON "amazon_products" USING btree ("brand");--> statement-breakpoint
CREATE INDEX "amazon_products_category_idx" ON "amazon_products" USING btree ("search_alias");--> statement-breakpoint
CREATE INDEX "amazon_products_rating_idx" ON "amazon_products" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "amazon_products_price_idx" ON "amazon_products" USING btree ("price");--> statement-breakpoint
CREATE INDEX "comparisons_folder_idx" ON "comparisons" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "comparisons_status_idx" ON "comparisons" USING btree ("status");--> statement-breakpoint
CREATE INDEX "folder_shares_folder_idx" ON "folder_shares" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "folder_shares_user_idx" ON "folder_shares" USING btree ("shared_with_user_id");--> statement-breakpoint
CREATE INDEX "folders_org_idx" ON "folders" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "folders_category_idx" ON "folders" USING btree ("category");--> statement-breakpoint
CREATE INDEX "user_products_folder_idx" ON "user_products" USING btree ("folder_id");--> statement-breakpoint
ALTER TABLE "amazon_products" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "comparisons" DROP COLUMN "amazon_asin";--> statement-breakpoint
ALTER TABLE "comparisons" DROP COLUMN "comparison_name";--> statement-breakpoint
ALTER TABLE "amazon_products" ADD CONSTRAINT "marketplace_asin_idx" UNIQUE("marketplace","asin");