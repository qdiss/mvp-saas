CREATE TABLE "organization_mappings" (
	"clerk_org_id" text PRIMARY KEY NOT NULL,
	"internal_org_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "organization_mappings_internal_org_id_unique" UNIQUE("internal_org_id")
);
--> statement-breakpoint
ALTER TABLE "folders" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "folders" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "organization_members" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "organization_members" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "id" DROP DEFAULT;