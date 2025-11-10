ALTER TABLE "folders" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "folders" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "folders" ADD COLUMN "color" text DEFAULT '#10b981';--> statement-breakpoint
ALTER TABLE "folders" ADD COLUMN "icon" text DEFAULT 'Folder';