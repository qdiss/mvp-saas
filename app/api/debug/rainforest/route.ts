// app/api/debug/rainforest/route.ts
// DEBUG: Inspect exact Rainforest API response to see video structure

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const asin = searchParams.get("asin");
  const marketplace = searchParams.get("marketplace") || "com";

  if (!asin) {
    return NextResponse.json({ error: "ASIN required" }, { status: 400 });
  }

  try {
    const url = new URL("https://api.rainforestapi.com/request");
    url.searchParams.append("api_key", process.env.RAINFOREST_API_KEY!);
    url.searchParams.append("type", "product");
    url.searchParams.append("amazon_domain", `amazon.${marketplace}`);
    url.searchParams.append("asin", asin);

    // Request videos
    url.searchParams.append("videos", "true");
    url.searchParams.append("video_count", "10");
    url.searchParams.append("a_plus_body", "true");
    url.searchParams.append("a_plus_third_party", "true");

    console.log("[DEBUG] Fetching:", url.toString());

    const response = await fetch(url.toString());
    const data = await response.json();

    // Log structure analysis
    console.log("\n[DEBUG] ========== RESPONSE ANALYSIS ==========");
    console.log("[DEBUG] Has product:", !!data.product);
    console.log("[DEBUG] Top-level keys:", Object.keys(data));

    if (data.product) {
      console.log("[DEBUG] Product keys:", Object.keys(data.product));
      console.log("[DEBUG] Videos field:", typeof data.product.videos);
      console.log("[DEBUG] Videos content:", data.product.videos);
      console.log("[DEBUG] Has videos:", !!data.product.videos);
      console.log("[DEBUG] Videos length:", data.product.videos?.length);
      console.log("[DEBUG] Has video field:", data.product.has_videos);
      console.log("[DEBUG] Related videos:", data.product.related_videos);
    }

    // Check other possible locations
    console.log("[DEBUG] Direct videos:", data.videos);
    console.log("[DEBUG] Media:", data.media);
    console.log("=======================================\n");

    // Return full response for inspection
    return NextResponse.json({
      success: true,
      asin,
      marketplace,
      hasProduct: !!data.product,
      hasVideosField: !!data.product?.videos,
      videosType: typeof data.product?.videos,
      videosLength: data.product?.videos?.length,
      hasVideoFlag: data.product?.has_videos,

      // Full response structure
      responseKeys: Object.keys(data),
      productKeys: data.product ? Object.keys(data.product) : [],

      // Videos in different possible locations
      videos: data.product?.videos || null,
      relatedVideos: data.product?.related_videos || null,
      directVideos: data.videos || null,
      media: data.media || null,

      // Sample of first video if exists
      firstVideo: data.product?.videos?.[0] || null,

      // Full raw response (for manual inspection)
      rawResponse: data,
    });
  } catch (error: any) {
    console.error("[DEBUG] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
