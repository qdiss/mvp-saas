// ============================================
// API ROUTE: Keyword Search
// app/api/search/competitors/route.ts
// ============================================

import { useAuth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = useAuth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { keyword, marketplace = "com", filters } = await req.json();

  try {
    // Call Rainforest API Search
    const response = await fetch(`https://api.rainforestapi.com/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: process.env.RAINFOREST_API_KEY,
        type: "search",
        amazon_domain: `amazon.${marketplace}`,
        search_term: keyword,
        sort_by: "featured", // or "price_low_to_high", "average_review", etc.
        ...filters,
      }),
    });

    const data = await response.json();

    // Extract ASINs and aggregate data
    const products = data.search_results || [];
    const asins = products.map((p: any) => p.asin);

    const aggregated = {
      totalResults: products.length,
      avgRating:
        products.reduce((acc: number, p: any) => acc + (p.rating || 0), 0) /
        products.length,
      avgPrice:
        products.reduce(
          (acc: number, p: any) => acc + (p.price?.value || 0),
          0
        ) / products.length,
      priceRange: {
        min: Math.min(...products.map((p: any) => p.price?.value || Infinity)),
        max: Math.max(...products.map((p: any) => p.price?.value || 0)),
      },
      topAsins: asins.slice(0, 20),
      products: products.slice(0, 10), // Return top 10 for preview
    };

    return NextResponse.json({
      success: true,
      data: aggregated,
    });
  } catch (error) {
    console.error("Error searching competitors:", error);
    return NextResponse.json(
      { error: "Failed to search competitors" },
      { status: 500 }
    );
  }
}
