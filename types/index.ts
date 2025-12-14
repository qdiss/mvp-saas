// types/index.ts

export type TabType = "overview" | "images" | "pricing" | "content";

export interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  photos: string[];
  selected?: boolean;

  image?: string;

  // Amazon specific
  asin?: string;
  brand?: string;
  link?: string;

  // Match scoring
  matchScore?: number | null;

  // Features & Description
  features?: string[];
  description?: string;
  specifications?: any[];

  // Availability
  inStock?: boolean;
  isPrime?: boolean;
  isFulfilledByAmazon?: boolean;

  // Bestseller
  bestsellerRank?: any[];

  // Category
  category?: string;
  categories?: any[];

  // Pricing details
  rrpValue?: number;
  savingsAmount?: number;
  savingsPercent?: number;
  hasCoupon?: boolean;
  couponText?: string;
  dealBadge?: string;

  // Seller info
  sellerName?: string;
  sellerRating?: number;

  // Sponsored status
  isSponsored?: boolean;

  // Variations
  hasVariations?: boolean;
  variationCount?: number;

  // Images details
  imagesCount?: number;
  has360View?: boolean;
  hasVideo?: boolean;

  // Q&A
  questionCount?: number;

  // Raw data from API
  rawData?: any;

  // Metadata
  addedAt?: string;
  position?: number;
  lastFetchedAt?: string;

  // ✅ Dodaj comparisonId
  comparisonId?: string;
}

export interface Comment {
  id: string;
  comparisonId?: string;
  content: string;
  images: string[]; // Array of image URLs
  imageCount: number;
  status: "open" | "resolved" | "archived";
  assignedTo?: string;
  dueDate?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
