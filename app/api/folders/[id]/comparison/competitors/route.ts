// app/api/folders/[id]/comparison/competitors/route.ts
// ✅ FINAL: Uses centralized helpers with videos_additional support

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/client";
import { comparisons, comparisonCompetitors } from "@/database/schema";
import { eq } from "drizzle-orm";
import {
  fetchCompleteProductData,
  saveProductToDatabase,
} from "@/lib/rainforest-helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: folderId } = await params;
    const body = await request.json();

    const {
      competitorAsins,
      competitorData,
      marketplace = "com",
      fetchInBackground = false,
    } = body;

    console.log(
      `[COMPETITORS API] START: ${
        competitorAsins?.length || 0
      } competitors for folder ${folderId}`
    );

    if (!competitorAsins || competitorAsins.length === 0) {
      return NextResponse.json(
        { error: "No competitor ASINs provided" },
        { status: 400 }
      );
    }

    // 1. Get comparison for this folder
    const [comparison] = await db
      .select()
      .from(comparisons)
      .where(eq(comparisons.folderId, folderId))
      .limit(1);

    if (!comparison) {
      return NextResponse.json(
        { error: "Comparison not found" },
        { status: 404 }
      );
    }

    // 2. Clear old competitors
    await db
      .delete(comparisonCompetitors)
      .where(eq(comparisonCompetitors.comparisonId, comparison.id));

    console.log(`[COMPETITORS] Cleared old competitors`);

    // 3. Save competitor links
    const competitorRecords = competitorAsins.map(
      (asin: string, index: number) => {
        const existingData = competitorData?.find((c: any) => c.asin === asin);
        return {
          comparisonId: comparison.id,
          asin,
          position: index,
          isVisible: true,
          matchScore: existingData?.matchScore?.toString() || null,
          addedBy: comparison.createdBy || "system",
          addedAt: new Date(),
        };
      }
    );

    await db.insert(comparisonCompetitors).values(competitorRecords);
    console.log(
      `[COMPETITORS] Saved ${competitorRecords.length} competitor links`
    );

    // 4. Fetch full data for each competitor
    if (!fetchInBackground) {
      // Synchronous fetch (wait for all)
      console.log(`[COMPETITORS] Fetching full data (synchronous)...`);

      const fetchPromises = competitorAsins.map(async (asin: string) => {
        try {
          console.log(`[COMPETITORS] Fetching ${asin}...`);

          // ✅ Use centralized helper
          const productData = await fetchCompleteProductData(asin, marketplace);

          if (productData) {
            // ✅ Save with isMyProduct=false (competitor)
            await saveProductToDatabase(
              productData,
              marketplace,
              false,
              comparison.id
            );

            console.log(`[COMPETITORS] ✅ Successfully saved ${asin}`);
          }

          return { asin, success: true };
        } catch (error: any) {
          console.error(
            `[COMPETITORS] ❌ Failed to fetch ${asin}:`,
            error.message
          );
          return { asin, success: false, error: error.message };
        }
      });

      const results = await Promise.all(fetchPromises);
      const successful = results.filter((r) => r.success).length;

      console.log(
        `[COMPETITORS] ✅ Complete: ${successful}/${competitorAsins.length} competitors fetched`
      );

      return NextResponse.json({
        success: true,
        message: `Saved ${successful} competitors with full data including videos`,
        competitorsCount: successful,
        results,
      });
    } else {
      // Background fetch (return immediately, fetch in background)
      console.log(`[COMPETITORS] Starting background fetch...`);

      // Fire and forget
      Promise.all(
        competitorAsins.map(async (asin: string) => {
          try {
            const productData = await fetchCompleteProductData(
              asin,
              marketplace
            );

            if (productData) {
              await saveProductToDatabase(
                productData,
                marketplace,
                false,
                comparison.id
              );
            }
          } catch (error: any) {
            console.error(`[COMPETITORS BG] Failed ${asin}:`, error.message);
          }
        })
      ).then(() => {
        console.log(`[COMPETITORS] Background fetch complete`);
      });

      return NextResponse.json({
        success: true,
        message: `Started fetching ${competitorAsins.length} competitors in background`,
        competitorsCount: competitorAsins.length,
      });
    }
  } catch (error: any) {
    console.error("[COMPETITORS API Error]", error);
    return NextResponse.json(
      { error: "Failed to save competitors", details: error.message },
      { status: 500 }
    );
  }
}
