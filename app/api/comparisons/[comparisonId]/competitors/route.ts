// app/api/comparisons/[comparisonId]/competitors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { useAuth } from "@clerk/nextjs";
import {
  comparisonCompetitors,
  amazonProducts,
  comparisons,
  productReviews,
} from "@/database/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/database/client";

export async function POST(
  req: NextRequest,
  { params }: { params: { comparisonId: string } }
) {
  try {
    const { userId } = useAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { competitors } = await req.json();
    const { comparisonId } = params;

    if (!competitors || !Array.isArray(competitors)) {
      return NextResponse.json(
        { error: "Competitors array is required" },
        { status: 400 }
      );
    }

    // Get max position
    const maxPos = await db
      .select({
        max: sql<number>`COALESCE(MAX(${comparisonCompetitors.position}), 0)`,
      })
      .from(comparisonCompetitors)
      .where(eq(comparisonCompetitors.comparisonId, comparisonId));

    let nextPosition = (maxPos[0]?.max || 0) + 1;

    // Add competitors
    const competitorData = competitors.map((asin: string) => ({
      comparisonId,
      asin,
      position: nextPosition++,
      addedBy: userId,
    }));

    await db.insert(comparisonCompetitors).values(competitorData);

    return NextResponse.json({
      success: true,
      message: `Added ${competitors.length} competitor(s)`,
    });
  } catch (error) {
    console.error("Error adding competitors:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to add competitors",
      },
      { status: 500 }
    );
  }
}

// app/api/comparisons/[comparisonId]/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: { comparisonId: string } }
) {
  try {
    const { userId } = useAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { comparisonId } = params;

    // Get comparison with all data
    const comparison = await db.query.comparisons.findFirst({
      where: eq(comparisons.id, comparisonId),
      with: {
        competitors: true,
      },
    });

    if (!comparison) {
      return NextResponse.json(
        { error: "Comparison not found" },
        { status: 404 }
      );
    }

    // Get primary product
    let primaryProduct = null;
    if (comparison.primaryAsin) {
      primaryProduct = await db.query.amazonProducts.findFirst({
        where: eq(amazonProducts.asin, comparison.primaryAsin),
        with: {
          images: { limit: 5 },
          reviews: { limit: 5, orderBy: [desc(productReviews.helpfulVotes)] },
        },
      });
    }

    // Get competitor products
    const competitorAsins = comparison.competitors.map((c) => c.asin);
    const competitorProducts = await db.query.amazonProducts.findMany({
      where: inArray(amazonProducts.asin, competitorAsins),
      with: {
        images: { limit: 5 },
        reviews: { limit: 3 },
      },
    });

    return NextResponse.json({
      success: true,
      comparison: {
        ...comparison,
        primaryProduct,
        competitorProducts,
      },
    });
  } catch (error) {
    console.error("Error fetching comparison:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch comparison",
      },
      { status: 500 }
    );
  }
}
