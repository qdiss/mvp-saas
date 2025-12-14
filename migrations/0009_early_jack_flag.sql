CREATE TABLE "comment_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DROP INDEX "image_comments_image_idx";--> statement-breakpoint
ALTER TABLE "comment_images" ADD CONSTRAINT "comment_images_comment_id_image_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."image_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comment_images_comment_idx" ON "comment_images" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "comment_images_url_idx" ON "comment_images" USING btree ("image_url");--> statement-breakpoint
ALTER TABLE "image_comments" DROP COLUMN "image_id";--> statement-breakpoint
ALTER TABLE "image_comments" DROP COLUMN "image_url";