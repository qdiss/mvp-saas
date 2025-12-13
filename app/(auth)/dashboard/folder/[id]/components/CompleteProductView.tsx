// app/folders/[id]/components/CompleteProductView.tsx
// Prikazuje APSOLUTNO SVE podatke

"use client";

import React, { useState } from "react";
import {
  Package,
  Star,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Image as ImageIcon,
  FileText,
  Award,
  AlertCircle,
  ExternalLink,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface ProductDisplayProps {
  product: any;
  isMyProduct?: boolean;
}

export function CompleteProductView({
  product,
  isMyProduct = false,
}: ProductDisplayProps) {
  const [activeSection, setActiveSection] = useState<string>("overview");

  if (!product || !product.name) {
    return (
      <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
        <p className="text-muted-foreground">No product data available</p>
      </div>
    );
  }

  const sections = [
    { id: "overview", label: "Overview", icon: Package },
    {
      id: "images",
      label: `Images (${product.photos?.length || 0})`,
      icon: ImageIcon,
    },
    {
      id: "features",
      label: `Features (${product.features?.length || 0})`,
      icon: FileText,
    },
    {
      id: "specs",
      label: `Specifications (${product.specifications?.length || 0})`,
      icon: Award,
    },
    { id: "ratings", label: "Ratings & Reviews", icon: Star },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-4">
          {/* Main Image */}
          {product.photos?.[0] && (
            <img
              src={product.photos[0]}
              alt={product.name}
              className="w-32 h-32 object-contain rounded-lg bg-white shadow-lg"
            />
          )}

          {/* Product Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isMyProduct && (
                <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                  MY PRODUCT
                </span>
              )}
              {product.isPrime && (
                <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                  Prime
                </span>
              )}
              {product.inStock ? (
                <span className="flex items-center gap-1 text-green-600 text-xs">
                  <CheckCircle className="h-3 w-3" /> In Stock
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600 text-xs">
                  <XCircle className="h-3 w-3" /> Out of Stock
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold mb-2 line-clamp-2">
              {product.name}
            </h2>

            {product.brand && (
              <p className="text-sm text-muted-foreground mb-3">
                Brand: <span className="font-semibold">{product.brand}</span>
              </p>
            )}

            {/* Key Stats */}
            <div className="grid grid-cols-3 gap-4">
              {/* Price */}
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    ${product.price}
                  </p>
                  {product.rrpValue && product.rrpValue > product.price && (
                    <p className="text-xs text-gray-500 line-through">
                      ${product.rrpValue}
                    </p>
                  )}
                </div>
              </div>

              {/* Rating */}
              {product.rating > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">{product.rating}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.reviews?.toLocaleString()} reviews
                    </p>
                  </div>
                </div>
              )}

              {/* Match Score (for competitors) */}
              {!isMyProduct && product.matchScore && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {product.matchScore.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Match Score</p>
                  </div>
                </div>
              )}
            </div>

            {/* Amazon Link */}
            {product.link && (
              <a
                href={product.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                <ShoppingCart className="h-4 w-4" />
                View on Amazon
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Category */}
        {product.category && (
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
            <p className="text-xs text-muted-foreground">
              Category: <span className="font-medium">{product.category}</span>
            </p>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeSection === section.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Content Sections */}
      <div className="min-h-[400px]">
        {/* Overview */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            {/* Coupons & Savings */}
            {(product.hasCoupon || product.savingsAmount > 0) && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">
                  💰 Savings Available
                </h3>
                {product.hasCoupon && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    🎟️ Coupon: {product.couponText}
                  </p>
                )}
                {product.savingsAmount > 0 && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    💵 Save ${product.savingsAmount} ({product.savingsPercent}%)
                  </p>
                )}
              </div>
            )}

            {/* Bestseller Rank */}
            {product.bestsellerRank && product.bestsellerRank.length > 0 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h3 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">
                  🏆 Bestseller Ranks
                </h3>
                <div className="space-y-1">
                  {product.bestsellerRank.map((rank: any, idx: number) => (
                    <p key={idx} className="text-sm">
                      #{rank.rank} in {rank.category}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Seller Info */}
            {product.sellerName && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold mb-2">Seller Information</h3>
                <p className="text-sm">
                  Sold by:{" "}
                  <span className="font-medium">{product.sellerName}</span>
                </p>
                {product.isFulfilledByAmazon && (
                  <p className="text-sm text-blue-600 mt-1">
                    ✓ Fulfilled by Amazon
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Images */}
        {activeSection === "images" && (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
            {product.photos?.map((photo: string, idx: number) => (
              <div
                key={idx}
                className="aspect-square bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <img
                  src={photo}
                  alt={`${product.name} - Image ${idx + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
        )}

        {/* Features */}
        {activeSection === "features" && (
          <div className="space-y-3">
            {product.features?.length > 0 ? (
              product.features.map((feature: string, idx: number) => (
                <div
                  key={idx}
                  className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{feature}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No features available
              </p>
            )}
          </div>
        )}

        {/* Specifications */}
        {activeSection === "specs" && (
          <div className="space-y-2">
            {product.specifications?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {product.specifications.map((spec: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      {spec.name}
                    </p>
                    <p className="font-medium">{spec.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No specifications available
              </p>
            )}
          </div>
        )}

        {/* Ratings & Reviews */}
        {activeSection === "ratings" && (
          <div className="space-y-6">
            {/* Rating Breakdown */}
            {product.rawData?.rating_breakdown && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold mb-4">Rating Breakdown</h3>
                <div className="space-y-2">
                  {Object.entries(product.rawData.rating_breakdown)
                    .reverse()
                    .map(([key, data]: [string, any]) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-sm w-20">
                          {key.replace("_", " ")}
                        </span>
                        <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500"
                            style={{ width: `${data.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {data.percentage}%
                        </span>
                        <span className="text-xs text-muted-foreground w-16 text-right">
                          ({data.count.toLocaleString()})
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Review Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {product.rating}
                </p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-600">
                  {product.reviews?.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {product.rawData?.rating_breakdown?.five_star?.percentage ||
                    0}
                  %
                </p>
                <p className="text-sm text-muted-foreground">5-Star Reviews</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
