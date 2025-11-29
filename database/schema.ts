import {
  pgTable,
  text,
  uuid,
  timestamp,
  decimal,
  integer,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- 1. ORGANIZATIONS ---
export const organizations = pgTable("organizations", {
 id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- 2. PROFILES (Clerk users) ---
export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull(),
  fullName: text("full_name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- 3. ORGANIZATION MEMBERS ---
export const rolesEnum = pgEnum("member_role", ["owner", "admin", "member"]);

export const organizationMembers = pgTable("organization_members", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(), // UUID → text
  userId: text("user_id").notNull(),
  role: rolesEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- 4. FOLDERS ---
export const folders = pgTable("folders", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  color: text("color").default("#10b981"), // NOVO
  icon: text("icon").default("Folder"), // NOVO
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- 5. USER PRODUCTS ---
export const userProducts = pgTable("user_products", {
  id: uuid("id").primaryKey().defaultRandom(),
  folderId: uuid("folder_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  brand: text("brand"),
  category: text("category"),
  specifications: jsonb("specifications"),
  metadata: jsonb("metadata"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- 6. AMAZON PRODUCTS ---
export const amazonProducts = pgTable("amazon_products", {
  asin: text("asin").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }),
  currency: text("currency"),
  brand: text("brand"),
  category: text("category"),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviewCount: integer("review_count"),
  imageUrls: text("image_urls").array(),
  specifications: jsonb("specifications"),
  rawData: jsonb("raw_data"),
  lastFetchedAt: timestamp("last_fetched_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- 7. COMPARISONS ---
export const statusEnum = pgEnum("comparison_status", [
  "draft",
  "in_progress",
  "completed",
]);

export const comparisons = pgTable("comparisons", {
  id: uuid("id").primaryKey().defaultRandom(),
  folderId: uuid("folder_id").notNull(),
  userProductId: uuid("user_product_id"),
  amazonAsin: text("amazon_asin"),
  comparisonName: text("comparison_name").notNull(),
  comparisonData: jsonb("comparison_data"),
  status: statusEnum("status").default("draft"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- 8. COMPARISON NOTES ---
export const noteTypeEnum = pgEnum("note_type", [
  "general",
  "pros",
  "cons",
  "technical",
]);

export const comparisonNotes = pgTable("comparison_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  comparisonId: uuid("comparison_id").notNull(),
  content: text("content").notNull(),
  noteType: noteTypeEnum("note_type").default("general"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- 9. COMPARISON MESSAGES ---
export const comparisonMessages = pgTable("comparison_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  comparisonId: uuid("comparison_id").notNull(),
  userId: text("user_id").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- 10. IMAGES ---
export const images = pgTable("images", {
  id: uuid("id").primaryKey().defaultRandom(),
  storagePath: text("storage_path").notNull(),
  url: text("url").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  altText: text("alt_text"),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- 11. FOLDER SHARES ---
export const permissionEnum = pgEnum("folder_permission", [
  "view",
  "edit",
  "admin",
]);

export const folderShares = pgTable("folder_shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  folderId: uuid("folder_id").notNull(),
  sharedWithUserId: text("shared_with_user_id"),
  sharedWithTeamId: text("shared_with_team_id"),
  permission: permissionEnum("permission").default("view"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- 12. ORGANIZATION MAPPINGS (Clerk ID to Internal UUID) ---
export const organizationMappings = pgTable("organization_mappings", {
  clerkOrgId: text("clerk_org_id").primaryKey(),
  internalOrgId: uuid("internal_org_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Relations (primjer) ---
export const organizationRelations = relations(organizations, ({ many }) => ({
  folders: many(folders),
}));
export const folderRelations = relations(folders, ({ many }) => ({
  products: many(userProducts),
  shares: many(folderShares),
  comparisons: many(comparisons),
}));
export const userProductRelations = relations(userProducts, ({ many }) => ({
  comparisons: many(comparisons),
}));
export const comparisonRelations = relations(comparisons, ({ many }) => ({
  notes: many(comparisonNotes),
  messages: many(comparisonMessages),
  images: many(images),
}));
