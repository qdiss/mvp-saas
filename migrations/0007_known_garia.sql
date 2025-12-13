ALTER TABLE "amazon_products" ADD COLUMN "is_my_product" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "amazon_products" ADD COLUMN "comparison_id" uuid;--> statement-breakpoint
ALTER TABLE "keyword_searches" ADD COLUMN "median_rating" numeric(3, 2);--> statement-breakpoint
ALTER TABLE "keyword_searches" ADD COLUMN "median_price" numeric(10, 2);--> statement-breakpoint
CREATE INDEX "amazon_products_is_my_product_idx" ON "amazon_products" USING btree ("is_my_product");--> statement-breakpoint
CREATE INDEX "amazon_products_comparison_id_idx" ON "amazon_products" USING btree ("comparison_id");