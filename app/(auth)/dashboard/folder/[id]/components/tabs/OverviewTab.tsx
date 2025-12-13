// app/folders/[id]/components/tabs/EnhancedOverviewTab.tsx
"use client";

import {
  Eye,
  ExternalLink,
  Star,
  TrendingUp,
  Package,
  ShoppingCart,
} from "lucide-react";
import { Product } from "@/types";
import { ComparisonMetric } from "../ComparisonMetric";

type OverviewTabProps = {
  myProduct: Product;
  competitors: Product[];
  onToggleCompetitor: (id: string) => void;
};

export function OverviewTab({
  myProduct,
  competitors,
  onToggleCompetitor,
}: OverviewTabProps) {
  const selectedCompetitors = competitors.filter((c) => c.selected);

  return (
    <div className="space-y-6">
      {/* Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 p-4">
          <h2 className="font-semibold">Product Comparison</h2>
        </div>
        <div className="p-6">
          {/* Table Header */}
          <div
            className="grid gap-4 mb-6"
            style={{
              gridTemplateColumns: `repeat(${
                2 + selectedCompetitors.length
              }, minmax(0, 1fr))`,
            }}
          >
            <div className="font-semibold text-slate-700">Metric</div>
            <div className="font-semibold text-emerald-700 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg px-3 py-2 text-center border-2 border-emerald-200">
              Your Product
            </div>
            {selectedCompetitors.map((comp, idx) => (
              <div
                key={comp.id}
                className="font-semibold text-slate-700 bg-slate-50 rounded-lg px-3 py-2 text-center text-sm border border-slate-200"
              >
                Competitor {idx + 1}
              </div>
            ))}
          </div>

          {/* Metrics */}
          <ComparisonMetric
            label="Price"
            myValue={`$${myProduct.price}`}
            competitorValues={selectedCompetitors.map((c) => `$${c.price}`)}
          />
          <ComparisonMetric
            label="Rating"
            myValue={
              myProduct.rating > 0 ? `${myProduct.rating} ⭐` : "New Product"
            }
            competitorValues={selectedCompetitors.map((c) => `${c.rating} ⭐`)}
          />
          <ComparisonMetric
            label="Reviews"
            myValue={myProduct.reviews?.toLocaleString() || "0"}
            competitorValues={selectedCompetitors.map(
              (c) => c.reviews?.toLocaleString() || "0"
            )}
          />
          <ComparisonMetric
            label="Images"
            myValue={myProduct.photos?.length || 0}
            competitorValues={selectedCompetitors.map(
              (c) => c.photos?.length || 0
            )}
          />
          <ComparisonMetric
            label="Prime"
            myValue={myProduct.isPrime ? "✓ Yes" : "✗ No"}
            competitorValues={selectedCompetitors.map((c) =>
              c.isPrime ? "✓ Yes" : "✗ No"
            )}
          />
          <ComparisonMetric
            label="In Stock"
            myValue={myProduct.inStock ? "✓ Yes" : "✗ No"}
            competitorValues={selectedCompetitors.map((c) =>
              c.inStock ? "✓ Yes" : "✗ No"
            )}
          />

          {/* NOVO: Brand Comparison */}
          <ComparisonMetric
            label="Brand"
            myValue={myProduct.brand || "N/A"}
            competitorValues={selectedCompetitors.map((c) => c.brand || "N/A")}
          />

          {/* NOVO: Bestseller Rank */}
          {myProduct.bestsellerRank && (
            <ComparisonMetric
              label="Bestseller Rank"
              myValue={
                myProduct.bestsellerRank?.[0]
                  ? `#${myProduct.bestsellerRank[0].rank}`
                  : "N/A"
              }
              competitorValues={selectedCompetitors.map((c) =>
                c.bestsellerRank?.[0] ? `#${c.bestsellerRank[0].rank}` : "N/A"
              )}
            />
          )}

          {/* NOVO: Features Count */}
          <ComparisonMetric
            label="Features"
            myValue={myProduct.features?.length || 0}
            competitorValues={selectedCompetitors.map(
              (c) => c.features?.length || 0
            )}
          />

          {/* NOVO: Specifications Count */}
          <ComparisonMetric
            label="Specifications"
            myValue={myProduct.specifications?.length || 0}
            competitorValues={selectedCompetitors.map(
              (c) => c.specifications?.length || 0
            )}
          />
        </div>
      </div>

      {/* Competitors List - ENHANCED */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
          <h2 className="font-semibold">
            All Competitors ({competitors.length})
          </h2>
          <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
            Find More
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {competitors.map((comp) => (
            <div
              key={comp.id}
              className={`p-4 hover:bg-slate-50 transition-colors ${
                comp.selected ? "bg-emerald-50/30" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={!!comp.selected}
                  onChange={() => onToggleCompetitor(comp.id)}
                  className="w-5 h-5 rounded border-2 cursor-pointer accent-emerald-600 mt-1"
                />

                {comp.photos?.[0] && (
                  <img
                    src={comp.photos[0]}
                    alt={comp.name}
                    className="w-20 h-20 rounded-lg object-contain border border-slate-200 bg-white"
                  />
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-sm line-clamp-2">
                      {comp.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                    <span>ASIN: {comp.asin}</span>
                    {comp.brand && <span>Brand: {comp.brand}</span>}
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {comp.isPrime && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                        Prime
                      </span>
                    )}
                    {comp.inStock ? (
                      <span className="text-xs text-green-600">✓ In Stock</span>
                    ) : (
                      <span className="text-xs text-red-600">
                        ✗ Out of Stock
                      </span>
                    )}
                    {comp.hasCoupon && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded font-medium">
                        🎟️ Coupon
                      </span>
                    )}
                    {comp.matchScore && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded font-medium">
                        {comp.matchScore.toFixed(0)}% Match
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="mb-2">
                    <p className="text-lg font-bold">${comp.price}</p>
                    <p className="text-xs text-slate-500">
                      {(
                        ((comp.price - myProduct.price) / myProduct.price) *
                        100
                      ).toFixed(0)}
                      %{comp.price > myProduct.price ? " higher" : " lower"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-yellow-600 mb-2">
                    <Star className="h-3 w-3 fill-yellow-500" />
                    <span>{comp.rating}</span>
                    <span className="text-muted-foreground">
                      ({comp.reviews?.toLocaleString()})
                    </span>
                  </div>

                  {comp.link && (
                    <a
                      href={comp.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* NOVO: Quick Stats Row */}
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Features:</span>{" "}
                  <span className="font-medium">
                    {comp.features?.length || 0}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Specs:</span>{" "}
                  <span className="font-medium">
                    {comp.specifications?.length || 0}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Images:</span>{" "}
                  <span className="font-medium">
                    {comp.photos?.length || 0}
                  </span>
                </div>
                {comp.bestsellerRank?.[0] && (
                  <div>
                    <span className="text-muted-foreground">Rank:</span>{" "}
                    <span className="font-medium">
                      #{comp.bestsellerRank[0].rank}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
