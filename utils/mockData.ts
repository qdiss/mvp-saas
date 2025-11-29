import { Product } from "../types"

export const MOCK_DATA_FOLDER_ID = "aa0b8211-47fd-4115-a917-c12ec7e10c34"

export const myProductInit: Product = {
    id: "my-1",
    name: "Premium Cooling Eye Mask - Therapeutic Gel Beads",
    asin: "B0MYPRODUCT",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
    price: 24.99,
    rating: 0,
    reviews: 0,
    isSponsored: false,
    photos: [
        "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
    ],
    description: "Premium therapeutic eye mask with cooling gel beads. Perfect for reducing puffiness, dark circles, and eye strain.",
    bulletPoints: ["Hot & Cold Therapy", "Reusable & Durable", "Ergonomic Design", "Medical Grade Materials"],
}

export const competitorsInit: Product[] = [
    {
        id: "comp-1",
        name: "USA Merchant - 2 Redesigned Therapeutic Spa Gel Bead Eye Masks",
        asin: "B0195CAWID",
        image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=400&fit=crop",
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
        description: "Therapeutic spa gel bead eye masks for hot and cold therapy. Reduce puffiness and soothe tired eyes.",
        bulletPoints: ["Spa Quality", "Hot/Cold Use", "Set of 2 Masks", "Adjustable Strap"],
    },
    {
        id: "comp-2",
        name: "HOT & COLD EYE PADS (CUCUMBER)",
        asin: "B086B2D6YX",
        image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&h=400&fit=crop",
        price: 19.99,
        rating: 4.3,
        reviews: 1523,
        rank: "#28 in Eye Care",
        isSponsored: false,
        selected: true,
        photos: ["https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&h=400&fit=crop"],
        description: "Cucumber infused eye pads for cooling relief. Natural ingredients for sensitive skin.",
        bulletPoints: ["Cucumber Infused", "Natural Relief", "Sensitive Skin Safe", "Disposable Pads"],
    },
    {
        id: "comp-3",
        name: "Luctude Gel Eye Mask Cooling Eye Mask for Dry Eyes",
        asin: "B09Y8XC1PC",
        image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop",
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
        description: "Cooling gel eye mask designed for dry eyes. Long-lasting cold therapy for maximum relief.",
        bulletPoints: ["Dry Eye Relief", "Long Lasting Cold", "Comfortable Fit", "Dermatologist Tested"],
    },
]