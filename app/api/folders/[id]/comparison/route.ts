// app/api/folders/[id]/comparison/route.ts
// Učitava KOMPLETAN comparison sa SVIM podacima

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/client";
import {
  comparisons,
  comparisonCompetitors,
  amazonProducts,
  productImages,
  folders,
} from "@/database/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: folderId } = await params;

    // 1. Pronađi comparison za ovaj folder
    const [comparison] = await db
      .select()
      .from(comparisons)
      .where(eq(comparisons.folderId, folderId))
      .limit(1);

    if (!comparison) {
      return NextResponse.json({
        success: true,
        comparison: null,
        message: "No comparison found for this folder",
      });
    }

    // 2. Učitaj MY PRODUCT (isMyProduct = true)
    let primaryProduct = null;

    const [myProduct] = await db
      .select()
      .from(amazonProducts)
      .where(
        and(
          eq(amazonProducts.comparisonId, comparison.id),
          eq(amazonProducts.isMyProduct, true)
        )
      )
      .limit(1);

    if (myProduct) {
      // Učitaj SVE slike za glavni proizvod
      const images = await db
        .select()
        .from(productImages)
        .where(eq(productImages.asin, myProduct.asin))
        .orderBy(productImages.position);

      primaryProduct = {
        ...myProduct,
        images: images,
      };
    }

    // 3. Učitaj COMPETITORS iz comparisonCompetitors
    const competitorLinks = await db
      .select()
      .from(comparisonCompetitors)
      .where(eq(comparisonCompetitors.comparisonId, comparison.id))
      .orderBy(comparisonCompetitors.position);

    // 4. Učitaj FULL DATA za svaki competitor
    const competitorProducts = await Promise.all(
      competitorLinks.map(async (link) => {
        // Učitaj proizvod
        const [product] = await db
          .select()
          .from(amazonProducts)
          .where(
            and(
              eq(amazonProducts.asin, link.asin),
              eq(amazonProducts.isMyProduct, false) // Samo competitori
            )
          )
          .limit(1);

        if (!product) return null;

        // Učitaj SVE slike
        const images = await db
          .select()
          .from(productImages)
          .where(eq(productImages.asin, product.asin))
          .orderBy(productImages.position);

        return {
          // SVE OSNOVNE PODATKE
          asin: product.asin,
          title: product.title,
          brand: product.brand,
          link: product.link,

          // PRICING - SVE
          price: product.price,
          currency: product.currency,
          priceRaw: product.priceRaw,
          rrpValue: product.rrpValue,
          savingsAmount: product.savingsAmount,
          savingsPercent: product.savingsPercent,
          hasCoupon: product.hasCoupon,
          couponText: product.couponText,
          dealBadge: product.dealBadge,

          // RATINGS
          rating: product.rating,
          ratingsTotal: product.ratingsTotal,
          ratingBreakdown: product.ratingBreakdown,

          // CATEGORIES
          categories: product.categories,
          categoriesFlat: product.categoriesFlat,
          categoryBreadcrumbs: product.categoryBreadcrumbs,

          // BESTSELLER
          bestsellerRank: product.bestsellerRank,
          bestsellerRankFlat: product.bestsellerRankFlat,

          // IMAGES - SVE
          mainImageUrl: product.mainImageUrl,
          imageUrls: product.imageUrls,
          imagesCount: product.imagesCount,
          has360View: product.has360View,
          hasVideo: product.hasVideo,
          images: images, // Full image objects

          // FEATURES - SVE
          featureBullets: product.featureBullets,
          featureBulletsCount: product.featureBulletsCount,
          description: product.description,
          descriptionHtml: product.descriptionHtml,

          // SPECIFICATIONS - SVE
          specifications: product.specifications,
          specificationsFlat: product.specificationsFlat,
          dimensions: product.dimensions,
          weight: product.weight,
          itemModelNumber: product.itemModelNumber,
          manufacturer: product.manufacturer,
          material: product.material,
          color: product.color,
          size: product.size,

          // AVAILABILITY
          isInStock: product.isInStock,
          availabilityRaw: product.availabilityRaw,
          isPrime: product.isPrime,
          isFulfilledByAmazon: product.isFulfilledByAmazon,
          hasFreeReturns: product.hasFreeReturns,

          // SELLER
          sellerName: product.sellerName,
          sellerRating: product.sellerRating,
          thirdPartySeller: product.thirdPartySeller,

          // BRAND CONTENT
          hasAPlusContent: product.hasAPlusContent,
          aPlusModules: product.aPlusModules,
          hasBrandStory: product.hasBrandStory,
          brandStoreLink: product.brandStoreLink,

          // VARIATIONS
          hasVariations: product.hasVariations,
          variationCount: product.variationCount,
          availableVariations: product.availableVariations,

          // RELATED
          frequentlyBoughtTogether: product.frequentlyBoughtTogether,
          similarProducts: product.similarProducts,

          // Q&A
          questionCount: product.questionCount,
          topQuestions: product.topQuestions,

          // RAW DATA - KOMPLETAN
          rawData: product.rawData,

          // METADATA iz comparisonCompetitors
          matchScore: link.matchScore,
          position: link.position,
          isVisible: link.isVisible,
          addedAt: link.addedAt,

          // FLAGS
          isMyProduct: product.isMyProduct,
          lastFetchedAt: product.lastFetchedAt,
          needsRefresh: product.needsRefresh,
        };
      })
    );

    // Filter null values
    const validCompetitors = competitorProducts.filter((c) => c !== null);

    // 5. Učitaj folder details
    const [folderData] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, folderId))
      .limit(1);

    // 6. Return SVE PODATKE
    return NextResponse.json({
      success: true,
      comparison: {
        id: comparison.id,
        name: comparison.name,
        description: comparison.description,
        status: comparison.status,
        marketplace: comparison.marketplace,

        // MY PRODUCT sa SVIM podacima
        primaryProduct: primaryProduct
          ? {
              asin: primaryProduct.asin,
              title: primaryProduct.title,
              brand: primaryProduct.brand,
              link: primaryProduct.link,

              // Pricing
              price: primaryProduct.price,
              currency: primaryProduct.currency,
              rrpValue: primaryProduct.rrpValue,
              savingsAmount: primaryProduct.savingsAmount,
              savingsPercent: primaryProduct.savingsPercent,
              hasCoupon: primaryProduct.hasCoupon,
              couponText: primaryProduct.couponText,

              // Ratings
              rating: primaryProduct.rating,
              ratingsTotal: primaryProduct.ratingsTotal,
              ratingBreakdown: primaryProduct.ratingBreakdown,

              // Categories
              categoriesFlat: primaryProduct.categoriesFlat,
              categories: primaryProduct.categories,

              // Bestseller
              bestsellerRank: primaryProduct.bestsellerRank,

              // Images
              mainImageUrl: primaryProduct.mainImageUrl,
              imageUrls: primaryProduct.imageUrls,
              images: primaryProduct.images,
              has360View: primaryProduct.has360View,
              hasVideo: primaryProduct.hasVideo,

              // Features
              featureBullets: primaryProduct.featureBullets,
              description: primaryProduct.description,

              // Specifications
              specifications: primaryProduct.specifications,
              dimensions: primaryProduct.dimensions,
              weight: primaryProduct.weight,

              // Availability
              isInStock: primaryProduct.isInStock,
              isPrime: primaryProduct.isPrime,
              isFulfilledByAmazon: primaryProduct.isFulfilledByAmazon,

              // Seller
              sellerName: primaryProduct.sellerName,

              // Brand
              hasAPlusContent: primaryProduct.hasAPlusContent,
              brandStoreLink: primaryProduct.brandStoreLink,

              // Variations
              hasVariations: primaryProduct.hasVariations,
              variationCount: primaryProduct.variationCount,

              // Related
              frequentlyBoughtTogether: primaryProduct.frequentlyBoughtTogether,

              // Q&A
              questionCount: primaryProduct.questionCount,

              // Raw
              rawData: primaryProduct.rawData,

              // Meta
              isMyProduct: true,
              lastFetchedAt: primaryProduct.lastFetchedAt,
            }
          : null,

        // COMPETITORS sa SVIM podacima
        competitorProducts: validCompetitors,

        createdAt: comparison.createdAt,
        updatedAt: comparison.updatedAt,
      },
      folder: folderData,
    });
  } catch (error: any) {
    console.error("[Load Comparison Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load comparison",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
