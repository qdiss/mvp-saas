ALTER TABLE "image_comments" ALTER COLUMN "image_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "image_comments" ADD COLUMN "image_url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "image_comments" ADD CONSTRAINT "image_comments_comparison_id_comparisons_id_fk" FOREIGN KEY ("comparison_id") REFERENCES "public"."comparisons"("id") ON DELETE no action ON UPDATE no action;