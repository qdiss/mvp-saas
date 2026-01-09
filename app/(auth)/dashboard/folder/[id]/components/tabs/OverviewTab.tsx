// app/folders/[id]/components/tabs/OverviewTab.tsx
// ✅ IMPROVED: Better UI/UX, cleaner layout, more information

import React, { useState } from "react";
import {
  ExternalLink,
  Star,
  Package,
  Award,
  ShoppingBag,
  Trash2,
  Loader2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Eye,
  Check,
} from "lucide-react";
import { Product } from "@/types";

type OverviewTabProps = {
  myProduct: Product;
  competitors: Product[];
  onToggleCompetitor: (id: string) => void;
  onProductDeleted?: (productId: string) => void;
};

export function OverviewTab({
  myProduct,
  competitors,
  onToggleCompetitor,
  onProductDeleted,
}: OverviewTabProps) {
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteProduct = async (productId: string, asin: string) => {
    setDeletingProduct(productId);

    try {
      const response = await fetch(`/api/products/${asin}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      if (onProductDeleted) {
        onProductDeleted(productId);
      }

      setDeleteConfirm(null);
      window.location.reload();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete product. Please try again.");
    } finally {
      setDeletingProduct(null);
    }
  };

  const renderProductCard = (
    product: Product,
    isMyProduct: boolean = false
  ) => {
    const isDeleting = deletingProduct === product.id;
    const showConfirm = deleteConfirm === product.id;

    // Calculate competitive insights
    const avgCompetitorPrice =
      competitors
        .filter((c) => c.selected)
        .reduce((sum, c) => sum + c.price, 0) /
      competitors.filter((c) => c.selected).length;

    const priceDiff =
      isMyProduct && avgCompetitorPrice
        ? (
            ((product.price - avgCompetitorPrice) / avgCompetitorPrice) *
            100
          ).toFixed(1)
        : null;

    return (
      <div
        key={product.id}
        className={`group bg-white rounded-xl border-2 p-5 hover:shadow-xl transition-all relative ${
          isMyProduct
            ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-white shadow-emerald-100"
            : product.selected
            ? "border-blue-300 shadow-blue-50"
            : "border-slate-200 opacity-70 hover:opacity-100"
        }`}
      >
        {/* Delete Button */}
        {!isMyProduct && (
          <button
            onClick={() => setDeleteConfirm(product.id)}
            className="absolute top-3 right-3 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            title="Delete product"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}

        {/* Delete Confirmation Dialog */}
        {showConfirm && (
          <div className="absolute inset-0 bg-white/98 backdrop-blur-sm rounded-xl flex items-center justify-center z-10 p-6">
            <div className="text-center max-w-sm">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-7 w-7 text-red-600" />
              </div>
              <h4 className="font-bold text-lg mb-2 text-slate-900">
                Delete Product?
              </h4>
              <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                Remove "{product.name.substring(0, 50)}..." permanently? This
                cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-semibold text-slate-700"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id, product.asin!)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Content */}
        <div className="flex gap-5 mb-4">
          {/* Image */}
          <div className="w-28 h-28 flex-shrink-0">
            <img
              src={product.photos?.[0] || "/placeholder.png"}
              alt={product.name}
              className="w-full h-full object-contain rounded-lg bg-slate-50 border border-slate-200"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Badge + Title */}
            <div className="mb-3">
              {isMyProduct && (
                <span className="inline-block px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-md mb-2">
                  YOUR PRODUCT
                </span>
              )}
              <h3 className="font-bold text-base line-clamp-2 mb-1.5 text-slate-900">
                {product.name}
              </h3>
              {product.brand && (
                <p className="text-sm text-slate-600 font-medium">
                  by {product.brand}
                </p>
              )}
            </div>

            {/* Price + Rating */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <span className="font-bold text-xl text-slate-900">
                  {product.price.toFixed(2)}
                </span>
                {priceDiff && (
                  <span
                    className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                      parseFloat(priceDiff) < 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {parseFloat(priceDiff) < 0 ? "" : "+"}
                    {priceDiff}%
                  </span>
                )}
              </div>

              <div className="h-5 w-px bg-slate-300" />

              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-slate-900">
                  {product.rating.toFixed(1)}
                </span>
                <span className="text-sm text-slate-500">
                  ({(product.reviews / 1000).toFixed(1)}K)
                </span>
              </div>
            </div>

            {/* Toggle + Action Buttons */}
            <div className="flex items-center gap-2">
              {!isMyProduct && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCompetitor(product.id);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    product.selected
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                      : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  }`}
                >
                  {product.selected ? (
                    <>
                      <Check className="h-3.5 w-3.5 inline mr-1" />
                      Visible
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5 inline mr-1" />
                      Show
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex gap-2 flex-wrap mb-4">
          {product.inStock !== undefined && (
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                product.inStock
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {product.inStock ? "✓ In Stock" : "✗ Out of Stock"}
            </span>
          )}
          {product.isPrime && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-bold">
              ⚡ Prime
            </span>
          )}
          {product.bestsellerRank && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-bold">
              🏆 Bestseller
            </span>
          )}
        </div>

        {/* Key Features */}
        {product.features && product.features.length > 0 && (
          <div className="mb-4 bg-slate-50 rounded-lg p-3 border border-slate-200">
            <h4 className="font-semibold text-xs mb-2 flex items-center gap-2 text-slate-700">
              <Package className="h-3.5 w-3.5" />
              KEY FEATURES
            </h4>
            <ul className="space-y-1.5">
              {product.features.slice(0, 3).map((feature, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs text-slate-700"
                >
                  <span className="text-blue-500 mt-0.5 font-bold">•</span>
                  <span className="flex-1 line-clamp-2">{feature}</span>
                </li>
              ))}
            </ul>
            {product.features.length > 3 && (
              <p className="text-xs text-slate-500 mt-2 font-medium">
                +{product.features.length - 3} more features
              </p>
            )}
          </div>
        )}

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-3 border-t-2 border-slate-100">
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-500">ASIN:</span>
              <span className="font-mono font-bold text-slate-700 ml-1">
                {product.asin}
              </span>
            </div>
            {product.bestsellerRank && product.bestsellerRank[0] && (
              <div>
                <span className="text-slate-500">Rank:</span>
                <span className="font-bold text-slate-700 ml-1">
                  #{product.bestsellerRank[0].rank}
                </span>
              </div>
            )}
          </div>
          {product.link && (
            <a
              href={product.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1.5 hover:underline"
            >
              View on Amazon
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    );
  };

  const selectedCompetitors = competitors.filter((c) => c.selected);
  const hiddenCompetitors = competitors.filter((c) => !c.selected);

  return (
    <div className="space-y-6">
      {/* Quick Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-900">
            ${myProduct.price}
          </p>
          <p className="text-xs text-emerald-700 font-semibold mt-1">
            Your Price
          </p>
        </div>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-900">
            {selectedCompetitors.length}
          </p>
          <p className="text-xs text-blue-700 font-semibold mt-1">
            Competitors
          </p>
        </div>
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-900">
            {myProduct.rating.toFixed(1)} ★
          </p>
          <p className="text-xs text-amber-700 font-semibold mt-1">
            Your Rating
          </p>
        </div>
        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-900">
            {selectedCompetitors.length > 0
              ? (
                  selectedCompetitors.reduce((sum, c) => sum + c.rating, 0) /
                  selectedCompetitors.length
                ).toFixed(1)
              : "—"}
          </p>
          <p className="text-xs text-purple-700 font-semibold mt-1">
            Avg Competitor
          </p>
        </div>
      </div>

      {/* My Product Section */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-emerald-600" />
          Your Product
        </h3>
        <div className="grid grid-cols-1">
          {renderProductCard(myProduct, true)}
        </div>
      </div>

      {/* Competitors Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-blue-600" />
            Competitors ({selectedCompetitors.length})
          </h3>
          {hiddenCompetitors.length > 0 && (
            <button
              onClick={() => {
                // Show all hidden competitors
                hiddenCompetitors.forEach((c) => onToggleCompetitor(c.id));
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              Show all ({hiddenCompetitors.length} hidden)
            </button>
          )}
        </div>

        {selectedCompetitors.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
            <Package className="h-16 w-16 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-semibold text-lg">
              No competitors selected
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Select competitors to compare with your product
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {selectedCompetitors.map((competitor) =>
              renderProductCard(competitor, false)
            )}
          </div>
        )}
      </div>

      {/* Hidden Competitors */}
      {hiddenCompetitors.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-4 text-slate-400 flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Hidden Products ({hiddenCompetitors.length})
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {hiddenCompetitors.map((competitor) =>
              renderProductCard(competitor, false)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
