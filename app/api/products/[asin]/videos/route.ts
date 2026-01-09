// app/api/products/[asin]/videos/route.ts
// API endpoint to fetch videos for a specific ASIN

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/client";
import { productVideos } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ asin: string }> }
) {
  try {
    const { asin } = await params;

    if (!asin) {
      return NextResponse.json({ error: "ASIN is required" }, { status: 400 });
    }

    // Fetch videos from database
    const videos = await db
      .select()
      .from(productVideos)
      .where(eq(productVideos.asin, asin));

    console.log(`[VIDEOS API] Found ${videos.length} videos for ${asin}`);

    return NextResponse.json({
      success: true,
      asin,
      videos,
      count: videos.length,
    });
  } catch (error: any) {
    console.error("[VIDEOS API Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch videos", details: error.message },
      { status: 500 }
    );
  }
}
