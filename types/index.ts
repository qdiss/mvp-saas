// types/index.ts
// ✅ UPDATED: Complete Product type with all properties

export type TabType =
  | "overview"
  | "images"
  | "videos"
  | "pricing"
  | "content"
  | "aplus";

export interface Product {
  id: string;
  name: string;
  title?: string; // ✅ Added - alternative name field
  price: number;
  rating: number;
  reviews: number;
  photos: string[];
  asin?: string;
  brand?: string;
  link?: string;
  selected?: boolean;
  matchScore?: number | null;
  features?: string[];
  specifications?: any[];
  inStock?: boolean;
  isPrime?: boolean;
  bestsellerRank?: any[];
  category?: string;
  addedAt?: string;
  position?: number;
  comparisonId?: string;
  rawData?: any; // Full API response for A+ content, videos, etc.

  // ✅ Image properties
  mainImageUrl?: string; // Main product image URL
  imageUrls?: string[]; // Alternative to photos
  imagesCount?: number;
  has360View?: boolean;

  // ✅ Video properties
  hasVideo?: boolean;

  // ✅ Pricing properties
  rrp?: number; // Recommended retail price
  savings?: number;
  currency?: string;

  // ✅ Rating properties
  ratingsTotal?: number;
  reviewsTotal?: number;

  // ✅ Additional properties
  marketplace?: string;
  isMyProduct?: boolean;
  addedBy?: string;
  categories?: string[];
  keywords?: string[];
  availability?: string;

  // ✅ Metadata
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  content: string;
  images: string[]; // Image URLs
  videos?: string[]; // Video URLs (optional)
  createdAt: string;
  createdBy: string;
  status: "open" | "resolved" | "archived";
  resolvedAt?: string; // ✅ Added
  resolvedBy?: string; // ✅ Added
  updatedAt?: string; // ✅ Added
}

export interface ProductComment extends Comment {
  productId: string;
  productName: string;
}

export interface ComparisonData {
  id: string;
  name: string;
  myProduct: Product;
  competitors: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface FolderData {
  id: string;
  name: string;
  description?: string;
  category?: string;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

// Video-specific types
export interface VideoData {
  id?: string; // ✅ Added
  url: string;
  thumbnail?: string;
  thumbnailUrl?: string; // ✅ Alternative field name
  title?: string;
  duration?: string;
  width?: number;
  height?: number;
  videoType?: string; // ✅ Added - hero, review, etc
  creatorName?: string; // ✅ Added
  creatorProfile?: string; // ✅ Added
}

// A+ Content types
export interface APlusModule {
  type: string;
  heading?: string;
  text?: string;
  html?: string;
  images?: Array<{ url: string; alt?: string }>;
  content?: any;
}

export interface BrandStory {
  id?: string;
  title?: string;
  description?: string;
  html?: string;
  logo?: string;
  link?: string;
  images?: string[];
  hero_image?: string; // ✅ Added
  brand_logo?: string; // ✅ Added
  body?: string; // ✅ Added
}

// ✅ NEW: A+ Content structure
export interface APlusContent {
  brand_story?: BrandStory;
  images?: string[];
  hero_image?: string;
  title?: string;
  description?: string;
  faqs?: Array<{
    title: string;
    body: string;
  }>;
  company_logo?: string;
  company_description_text?: string;
  has_a_plus_content?: boolean;
  third_party?: boolean;
  [key: string]: any; // For other module types
}
