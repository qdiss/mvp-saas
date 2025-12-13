import { Product } from "../types";

export const MOCK_DATA_FOLDER_ID = "52a7bb5b-0a17-406a-a0a0-1967050b5f4c";

export const myProductInit: Product = {
  id: "my-1",
  name: "Premium Cooling Eye Mask - Therapeutic Gel Beads",
  asin: "B0MYPRODUCT",
  image:
    "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
  price: 24.99,
  rating: 0,
  reviews: 0,
  isSponsored: false,
  photos: [
    "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
  ],
  description:
    "Premium therapeutic eye mask with cooling gel beads. Perfect for reducing puffiness, dark circles, and eye strain.",
  bulletPoints: [
    "Hot & Cold Therapy",
    "Reusable & Durable",
    "Ergonomic Design",
    "Medical Grade Materials",
  ],
};

export const competitorsInit: Product[] = [
  {
    id: "comp-1",
    name: "USA Merchant - 2 Redesigned Therapeutic Spa Gel Bead Eye Masks",
    asin: "B0195CAWID",
    image:
      "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=400&fit=crop",
    price: 22.99,
    rating: 4.5,
    reviews: 2847,
    rank: "#12 in Eye Care",
    isSponsored: true,
    selected: true,
    photos: [
      "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop",
    ],
    description:
      "Therapeutic spa gel bead eye masks for hot and cold therapy. Reduce puffiness and soothe tired eyes.",
    bulletPoints: [
      "Spa Quality",
      "Hot/Cold Use",
      "Set of 2 Masks",
      "Adjustable Strap",
    ],
  },
  {
    id: "comp-2",
    name: "HOT & COLD EYE PADS (CUCUMBER)",
    asin: "B086B2D6YX",
    image:
      "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&h=400&fit=crop",
    price: 19.99,
    rating: 4.3,
    reviews: 1523,
    rank: "#28 in Eye Care",
    isSponsored: false,
    selected: true,
    photos: [
      "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&h=400&fit=crop",
    ],
    description:
      "Cucumber infused eye pads for cooling relief. Natural ingredients for sensitive skin.",
    bulletPoints: [
      "Cucumber Infused",
      "Natural Relief",
      "Sensitive Skin Safe",
      "Disposable Pads",
    ],
  },
  {
    id: "comp-3",
    name: "Luctude Gel Eye Mask Cooling Eye Mask for Dry Eyes",
    asin: "B09Y8XC1PC",
    image:
      "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop",
    price: 16.99,
    rating: 4.7,
    reviews: 3245,
    rank: "#8 in Eye Care",
    isSponsored: true,
    selected: false,
    photos: [
      "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop",
    ],
    description:
      "Cooling gel eye mask designed for dry eyes. Long-lasting cold therapy for maximum relief.",
    bulletPoints: [
      "Dry Eye Relief",
      "Long Lasting Cold",
      "Comfortable Fit",
      "Dermatologist Tested",
    ],
  },
];

// utils/mockCompetitorData.ts

export const MOCK_PRODUCTS_DATABASE: Record<string, any> = {
  // Wireless Earbuds Category
  B08X7FN3RX: {
    product: {
      asin: "B08X7FN3RX",
      title: "Sony WF-1000XM4 Wireless Earbuds - Premium Noise Cancelling",
      brand: "Sony",
      link: "https://amazon.com/dp/B08X7FN3RX",
      rating: 4.6,
      ratings_total: 12847,
      search_alias: { value: "electronics", title: "Electronics" },
      categories_flat: "Electronics > Headphones > Earbuds",
      keywords: "wireless earbuds noise cancelling sony premium",
      buybox_winner: {
        price: { value: 278, currency: "USD", symbol: "$", raw: "$278.00" },
        availability: { type: "in_stock", raw: "In Stock" },
        is_prime: true,
      },
      main_image: {
        link: "https://images-na.ssl-images-amazon.com/images/I/61V3tSoNMPL._AC_SL1500_.jpg",
      },
      images: [
        {
          link: "https://images-na.ssl-images-amazon.com/images/I/61V3tSoNMPL._AC_SL1500_.jpg",
          variant: "MAIN",
        },
        {
          link: "https://images-na.ssl-images-amazon.com/images/I/71XEkcJS8aL._AC_SL1500_.jpg",
          variant: "PT01",
        },
      ],
      feature_bullets: [
        "Industry-leading noise cancellation",
        "Exceptional sound quality with LDAC",
        "Up to 8 hours battery life",
        "IPX4 water resistance",
      ],
    },
    competitors: [
      {
        asin: "B0BNRQCFZP",
        title: "Bose QuietComfort Earbuds II - Wireless Noise Cancelling",
        price: 279,
        rating: 4.5,
        ratingsTotal: 8432,
        imageUrl:
          "https://images-na.ssl-images-amazon.com/images/I/51K+W3HZ8lL._AC_SL1000_.jpg",
        score: 95,
        brand: "Bose",
      },
      {
        asin: "B0BSHF7LKM",
        title: "Apple AirPods Pro (2nd Generation)",
        price: 249,
        rating: 4.7,
        ratingsTotal: 24891,
        imageUrl:
          "https://images-na.ssl-images-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg",
        score: 92,
        brand: "Apple",
      },
      {
        asin: "B09JQL3NWT",
        title: "Sennheiser MOMENTUM True Wireless 3",
        price: 279.95,
        rating: 4.4,
        ratingsTotal: 3214,
        imageUrl:
          "https://images-na.ssl-images-amazon.com/images/I/61vqQ3SAVRL._AC_SL1500_.jpg",
        score: 88,
        brand: "Sennheiser",
      },
      {
        asin: "B0C33XXS56",
        title: "Samsung Galaxy Buds2 Pro",
        price: 229.99,
        rating: 4.5,
        ratingsTotal: 11237,
        imageUrl:
          "https://images-na.ssl-images-amazon.com/images/I/51W8hAFWcIL._AC_SL1000_.jpg",
        score: 85,
        brand: "Samsung",
      },
      {
        asin: "B09YD5BLTR",
        title: "Jabra Elite 85t True Wireless Earbuds",
        price: 199.99,
        rating: 4.3,
        ratingsTotal: 7891,
        imageUrl:
          "https://images-na.ssl-images-amazon.com/images/I/61s3B5yBh1L._AC_SL1500_.jpg",
        score: 82,
        brand: "Jabra",
      },
    ],
  },

  // Smart Watch Category
  B0CSVZ9DL2: {
    product: {
      asin: "B0CSVZ9DL2",
      title: "Apple Watch Series 9 GPS 45mm - Midnight Aluminum Case",
      brand: "Apple",
      link: "https://amazon.com/dp/B0CSVZ9DL2",
      rating: 4.8,
      ratings_total: 18234,
      search_alias: { value: "electronics", title: "Electronics" },
      categories_flat: "Electronics > Wearable Technology > Smart Watches",
      keywords: "smart watch apple fitness tracker health",
      buybox_winner: {
        price: { value: 429, currency: "USD", symbol: "$", raw: "$429.00" },
        availability: { type: "in_stock", raw: "In Stock" },
        is_prime: true,
      },
      main_image: {
        link: "https://images-na.ssl-images-amazon.com/images/I/71eD7yj+A-L._AC_SL1500_.jpg",
      },
      images: [
        {
          link: "https://images-na.ssl-images-amazon.com/images/I/71eD7yj+A-L._AC_SL1500_.jpg",
          variant: "MAIN",
        },
        {
          link: "https://images-na.ssl-images-amazon.com/images/I/71kDO0b0GNL._AC_SL1500_.jpg",
          variant: "PT01",
        },
      ],
      feature_bullets: [
        "Advanced health monitoring",
        "Bright Always-On Retina display",
        "Fast charging capability",
        "Water resistant up to 50m",
      ],
    },
    competitors: [
      {
        asin: "B0CSTJK16D",
        title: "Samsung Galaxy Watch 6 Classic 47mm",
        price: 399.99,
        rating: 4.6,
        ratingsTotal: 5821,
        imageUrl:
          "https://images-na.ssl-images-amazon.com/images/I/61RZ6aKfJbL._AC_SL1500_.jpg",
        score: 89,
        brand: "Samsung",
      },
      {
        asin: "B0BZKZT1YY",
        title: "Garmin Forerunner 965 Premium GPS Running Watch",
        price: 599.99,
        rating: 4.7,
        ratingsTotal: 3124,
        imageUrl:
          "https://images-na.ssl-images-amazon.com/images/I/61UdNjVnSQL._AC_SL1500_.jpg",
        score: 83,
        brand: "Garmin",
      },
      {
        asin: "B0C4WTKGCG",
        title: "Fitbit Sense 2 Advanced Health Smartwatch",
        price: 249.95,
        rating: 4.4,
        ratingsTotal: 8932,
        imageUrl:
          "https://images-na.ssl-images-amazon.com/images/I/61xR7RzEQJL._AC_SL1500_.jpg",
        score: 78,
        brand: "Fitbit",
      },
    ],
  },

  // Laptop Category
  B0CM5JV268: {
    product: {
      asin: "B0CM5JV268",
      title: "Apple MacBook Pro 14-inch M3 Chip, 16GB RAM, 512GB SSD",
      brand: "Apple",
      link: "https://amazon.com/dp/B0CM5JV268",
      rating: 4.9,
      ratings_total: 2847,
      search_alias: { value: "computers", title: "Computers" },
      categories_flat:
        "Electronics > Computers > Laptops > Traditional Laptops",
      keywords: "macbook pro laptop apple m3 professional",
      buybox_winner: {
        price: { value: 1599, currency: "USD", symbol: "$", raw: "$1,599.00" },
        availability: { type: "in_stock", raw: "In Stock" },
        is_prime: true,
      },
      main_image: {
        link: "https://images-na.ssl-images-amazon.com/images/I/61fd2oV-f4L._AC_SL1500_.jpg",
      },
      images: [
        {
          link: "https://images-na.ssl-images-amazon.com/images/I/61fd2oV-f4L._AC_SL1500_.jpg",
          variant: "MAIN",
        },
      ],
      feature_bullets: [
        "Apple M3 chip for incredible performance",
        "14-inch Liquid Retina XDR display",
        "Up to 22 hours battery life",
        "Advanced camera and audio",
      ],
    },
    competitors: [
      {
        asin: "B0C7CN5S15",
        title: "Dell XPS 14 Laptop - Intel Core i7, 16GB RAM, 512GB SSD",
        price: 1499.99,
        rating: 4.6,
        ratingsTotal: 1234,
        imageUrl:
          "https://images-na.ssl-images-amazon.com/images/I/71Yq2gCKiYL._AC_SL1500_.jpg",
        score: 87,
        brand: "Dell",
      },
      {
        asin: "B0CLN2BYTX",
        title: "HP Spectre x360 14 2-in-1 Laptop Intel Core i7",
        price: 1399.99,
        rating: 4.5,
        ratingsTotal: 892,
        imageUrl:
          "https://images-na.ssl-images-amazon.com/images/I/71gZE3xqSyL._AC_SL1500_.jpg",
        score: 82,
        brand: "HP",
      },
      {
        asin: "B0BSHCMXKP",
        title: "Lenovo ThinkPad X1 Carbon Gen 11 14 inch Laptop",
        price: 1649.99,
        rating: 4.7,
        ratingsTotal: 2103,
        imageUrl:
          "https://images-na.ssl-images-amazon.com/images/I/61pVqajs7tL._AC_SL1500_.jpg",
        score: 85,
        brand: "Lenovo",
      },
    ],
  },

  // Coffee Maker Category
  B01N6T5QNO: {
    product: {
      asin: "B01N6T5QNO",
      title: "Breville Barista Express Espresso Machine",
      brand: "Breville",
      link: "https://amazon.com/dp/B01N6T5QNO",
      rating: 4.6,
      ratings_total: 14523,
      search_alias: { value: "kitchen", title: "Kitchen & Dining" },
      categories_flat: "Home & Kitchen > Kitchen & Dining > Coffee Makers",
      keywords: "espresso machine coffee maker breville barista",
      buybox_winner: {
        price: { value: 599.95, currency: "USD", symbol: "$", raw: "$599.95" },
        availability: { type: "in_stock", raw: "In Stock" },
        is_prime: true,
      },
      main_image: {
        link: "https://images-na.ssl-images-amazon.com/images/I/91ViHTnubPL._AC_SL1500_.jpg",
      },
      images: [
        {
          link: "https://images-na.ssl-images-amazon.com/images/I/91ViHTnubPL._AC_SL1500_.jpg",
          variant: "MAIN",
        },
      ],
      feature_bullets: [
        "Built-in grinder with dose control",
        "15 bar Italian pump",
        "Precise espresso extraction",
        "Steam wand for milk texturing",
      ],
    },
    competitors: [
      {
        asin: "B07DVPPKGR",
        title: "De'Longhi La Specialista Arte Espresso Machine",
        price: 649.95,
        rating: 4.5,
        ratingsTotal: 3214,
        imageUrl:
          "https://images-na.ssl-images-amazon.com/images/I/71V8oqqqRDL._AC_SL1500_.jpg",
        score: 91,
        brand: "De'Longhi",
      },
      {
        asin: "B08YR2N3F3",
        title: "Gaggia Classic Pro Espresso Machine",
        price: 449,
        rating: 4.6,
        ratingsTotal: 6821,
        imageUrl:
          "https://images-na.ssl-images-amazon.com/images/I/71q+3FP9J6L._AC_SL1500_.jpg",
        score: 86,
        brand: "Gaggia",
      },
      {
        asin: "B0B41DFV37",
        title: "Philips 3200 Series Fully Automatic Espresso Machine",
        price: 729.95,
        rating: 4.4,
        ratingsTotal: 5234,
        imageUrl:
          "https://images-na.ssl-images-amazon.com/images/I/61dwx6yVDvL._AC_SL1500_.jpg",
        score: 83,
        brand: "Philips",
      },
    ],
  },
};

// Helper function to simulate API delay
const simulateApiDelay = (ms: number = 1500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Mock API function
export async function fetchMockProductWithCompetitors(asin: string) {
  // Simulate API delay
  await simulateApiDelay(1500);

  const mockData = MOCK_PRODUCTS_DATABASE[asin];

  if (!mockData) {
    throw new Error(
      `ASIN ${asin} not found in mock database. Available ASINs: ${Object.keys(
        MOCK_PRODUCTS_DATABASE
      ).join(", ")}`
    );
  }

  return {
    success: true,
    product: {
      asin: mockData.product.asin,
      title: mockData.product.title,
      brand: mockData.product.brand,
      price: mockData.product.buybox_winner.price.value,
      currency: mockData.product.buybox_winner.price.currency,
      rating: mockData.product.rating,
      ratingsTotal: mockData.product.ratings_total,
      imageUrl: mockData.product.main_image.link,
      link: mockData.product.link,
    },
    suggestedCompetitors: mockData.competitors,
    comparison: null,
    metadata: {
      totalFound: mockData.competitors.length,
      topReturned: mockData.competitors.length,
      searchStrategies: 3,
      mode: "MOCK_DATA", // Indicator that this is mock data
    },
  };
}
