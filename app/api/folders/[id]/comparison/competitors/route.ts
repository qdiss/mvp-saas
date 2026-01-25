// app/api/folders/[id]/comparison/competitors/route.ts
// ✅ FIXED: Now APPENDS new competitors instead of replacing all

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
  { params }: { params: Promise<{ id: string }> },
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
      } NEW competitors for folder ${folderId}`,
    );

    if (!competitorAsins || competitorAsins.length === 0) {
      return NextResponse.json(
        { error: "No competitor ASINs provided" },
        { status: 400 },
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
        { status: 404 },
      );
    }

    // ✅ 2. Get EXISTING competitors to preserve them
    const existingCompetitors = await db
      .select()
      .from(comparisonCompetitors)
      .where(eq(comparisonCompetitors.comparisonId, comparison.id))
      .orderBy(comparisonCompetitors.position);

    console.log(
      `[COMPETITORS] Found ${existingCompetitors.length} existing competitors`,
    );

    // ✅ 3. Filter out duplicates (ASINs already in comparison)
    const existingAsins = new Set(existingCompetitors.map((c) => c.asin));
    const newAsins = competitorAsins.filter(
      (asin: string) => !existingAsins.has(asin),
    );

    if (newAsins.length === 0) {
      console.log(`[COMPETITORS] All ASINs already exist, nothing to add`);
      return NextResponse.json({
        success: true,
        message: "All competitors already exist in comparison",
        competitorsCount: 0,
        duplicatesSkipped: competitorAsins.length,
      });
    }

    console.log(
      `[COMPETITORS] Adding ${newAsins.length} new competitors (${
        competitorAsins.length - newAsins.length
      } duplicates skipped)`,
    );

    // ✅ 4. Calculate starting position (append after existing)
    const maxPosition =
      existingCompetitors.length > 0
        ? Math.max(...existingCompetitors.map((c) => c.position || 0))
        : -1;

    // ✅ 5. Save NEW competitor links only
    const competitorRecords = newAsins.map((asin: string, index: number) => {
      const existingData = competitorData?.find((c: any) => c.asin === asin);
      return {
        comparisonId: comparison.id,
        asin,
        position: maxPosition + 1 + index, // ✅ Append after existing
        isVisible: true,
        matchScore: existingData?.matchScore?.toString() || null,
        addedBy: comparison.createdBy || "system",
        addedAt: new Date(),
      };
    });

    await db.insert(comparisonCompetitors).values(competitorRecords);
    console.log(
      `[COMPETITORS] Saved ${competitorRecords.length} new competitor links`,
    );

    // 6. Fetch full data for each NEW competitor
    if (!fetchInBackground) {
      // Synchronous fetch (wait for all)
      console.log(`[COMPETITORS] Fetching full data (synchronous)...`);

      const fetchPromises = newAsins.map(async (asin: string) => {
        try {
          console.log(`[COMPETITORS] Fetching ${asin}...`);

          const productData = await fetchCompleteProductData(asin, marketplace);

          if (productData) {
            await saveProductToDatabase(
              productData,
              marketplace,
              false,
              comparison.id,
            );

            console.log(`[COMPETITORS] ✅ Successfully saved ${asin}`);
          }

          return { asin, success: true };
        } catch (error: any) {
          console.error(
            `[COMPETITORS] ❌ Failed to fetch ${asin}:`,
            error.message,
          );
          return { asin, success: false, error: error.message };
        }
      });

      const results = await Promise.all(fetchPromises);
      const successful = results.filter((r) => r.success).length;

      console.log(
        `[COMPETITORS] ✅ Complete: ${successful}/${newAsins.length} new competitors fetched`,
      );

      return NextResponse.json({
        success: true,
        message: `Added ${successful} new competitors (${existingCompetitors.length} existing preserved)`,
        competitorsCount: successful,
        existingCount: existingCompetitors.length,
        totalCount: existingCompetitors.length + successful,
        duplicatesSkipped: competitorAsins.length - newAsins.length,
        results,
      });
    } else {
      // Background fetch (return immediately, fetch in background)
      console.log(`[COMPETITORS] Starting background fetch...`);

      Promise.all(
        newAsins.map(async (asin: string) => {
          try {
            const productData = await fetchCompleteProductData(
              asin,
              marketplace,
            );

            if (productData) {
              await saveProductToDatabase(
                productData,
                marketplace,
                false,
                comparison.id,
              );
            }
          } catch (error: any) {
            console.error(`[COMPETITORS BG] Failed ${asin}:`, error.message);
          }
        }),
      ).then(() => {
        console.log(`[COMPETITORS] Background fetch complete`);
      });

      return NextResponse.json({
        success: true,
        message: `Started fetching ${newAsins.length} new competitors in background`,
        competitorsCount: newAsins.length,
        existingCount: existingCompetitors.length,
        duplicatesSkipped: competitorAsins.length - newAsins.length,
      });
    }
  } catch (error: any) {
    console.error("[COMPETITORS API Error]", error);
    return NextResponse.json(
      { error: "Failed to save competitors", details: error.message },
      { status: 500 },
    );
  }
}
