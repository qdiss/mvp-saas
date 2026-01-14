// app/api/images/download/route.ts
// ✅ Proxy endpoint for downloading cross-origin images

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL required" },
        { status: 400 }
      );
    }

    console.log(`[IMAGE DOWNLOAD] Fetching: ${imageUrl}`);

    // Fetch image from external URL
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // Get image as buffer
    const imageBuffer = await response.arrayBuffer();

    // Determine content type
    const contentType = response.headers.get("content-type") || "image/jpeg";

    console.log(
      `[IMAGE DOWNLOAD] ✅ Downloaded ${imageBuffer.byteLength} bytes`
    );

    // Return image with download headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": 'attachment; filename="product-image.jpg"',
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error: any) {
    console.error("[IMAGE DOWNLOAD] Error:", error);
    return NextResponse.json(
      { error: "Failed to download image", details: error.message },
      { status: 500 }
    );
  }
}
