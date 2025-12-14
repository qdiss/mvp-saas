// //TODO: Add competitor selection step after fetching main product
// //TODO: Add types and interfaces for better type checking
// //TODO: Add validation and error handling
// //TODO: Improve UI/UX with better styling and feedback
// //TODO: Allow manual product entry if ASIN is not found
// //TODO: Optimize state management for larger flows
// //TODO: Add loading states and spinners during API calls
// //TODO: Ensure accessibility compliance for dialog and form elements
"use client";

import React, { useState } from "react";
import {
  Search,
  Package,
  Loader2,
  CheckCircle2,
  Plus,
  X,
  Sparkles,
  Users,
  ShoppingBag,
  Eye,
  ShoppingCart,
} from "lucide-react";

type AddProductFlowProps = {
  folderId: string;
  onProductAdded: (product: any, competitors: any[]) => void;
};

export function AddProductFlow({
  folderId,
  onProductAdded,
}: AddProductFlowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<
    // ✅
    | "method"
    | "asin"
    | "search"
    | "select_my_product"
    | "loading"
    | "competitors"
    | "saving"
  >("method"); // ✅ >("method")
  const [asin, setAsin] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [marketplace, setMarketplace] = useState("com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savingProgress, setSavingProgress] = useState("");
  const [fetchStats, setFetchStats] = useState<any>(null);

  const [product, setProduct] = useState<any>(null);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const marketplaces = [
    { code: "com", name: "Amazon.com", flag: "🇺🇸" },
    { code: "co.uk", name: "Amazon.co.uk", flag: "🇬🇧" },
    { code: "de", name: "Amazon.de", flag: "🇩🇪" },
    { code: "fr", name: "Amazon.fr", flag: "🇫🇷" },
    { code: "it", name: "Amazon.it", flag: "🇮🇹" },
    { code: "es", name: "Amazon.es", flag: "🇪🇸" },
    { code: "ca", name: "Amazon.ca", flag: "🇨🇦" },
    { code: "com.mx", name: "Amazon.com.mx", flag: "🇲🇽" },
  ];

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "similar_to_consider":
        return {
          icon: <Sparkles className="h-3 w-3" />,
          label: "Related Product",
          color: "bg-purple-100 text-purple-700 border-purple-200",
        };
      case "also_viewed":
        return {
          icon: <Eye className="h-3 w-3" />,
          label: "Also Viewed",
          color: "bg-blue-100 text-blue-700 border-blue-200",
        };
      case "also_bought":
        return {
          icon: <ShoppingCart className="h-3 w-3" />,
          label: "Also Bought",
          color: "bg-cyan-100 text-cyan-700 border-cyan-200",
        };
      case "frequently_bought_together":
        return {
          icon: <ShoppingBag className="h-3 w-3" />,
          label: "Bought Together",
          color: "bg-green-100 text-green-700 border-green-200",
        };
      case "search":
        return {
          icon: <Search className="h-3 w-3" />,
          label: "From Search",
          color: "bg-indigo-100 text-indigo-700 border-indigo-200",
        };
      case "category_search":
        return {
          icon: <Search className="h-3 w-3" />,
          label: "Similar Category",
          color: "bg-amber-100 text-amber-700 border-amber-200",
        };
      default:
        return {
          icon: <Package className="h-3 w-3" />,
          label: "Related",
          color: "bg-slate-100 text-slate-700 border-slate-200",
        };
    }
  };

  const handleFetchByASIN = async () => {
    if (!asin.trim()) {
      setError("Please enter an ASIN");
      return;
    }

    setLoading(true);
    setError("");
    setStep("loading");

    try {
      const response = await fetch("/api/products/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asin: asin.trim(),
          marketplace,
          folderId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch product");
      }

      setProduct(data.product);
      setCompetitors(data.suggestedCompetitors || []);
      setFetchStats(data.stats);

      // Auto-select ALL competitors
      setSelectedCompetitors(
        data.suggestedCompetitors?.map((c: any) => c.asin) || []
      );

      setStep("competitors");
    } catch (err: any) {
      setError(err.message || "Failed to fetch product");
      setStep("asin");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchProducts = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a search term");
      return;
    }

    setLoading(true);
    setError("");
    setStep("loading");

    try {
      const response = await fetch("/api/products/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery.trim(),
          marketplace,
          maxResults: 20,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      if (!data.results || data.results.length === 0) {
        setError("No products found. Try a different search term.");
        setStep("search");
        return;
      }

      setSearchResults(data.results || []);
      setStep("select_my_product");
    } catch (err: any) {
      setError(err.message || "Search failed");
      setStep("search");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMyProduct = async (selectedProduct: any) => {
    setLoading(true);
    setStep("loading");

    try {
      // Fetch full product data WITHOUT related products (search flow)
      const response = await fetch("/api/products/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asin: selectedProduct.asin,
          marketplace,
          folderId,
          skipRelatedProducts: true, // ← DODAJ OVO
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch full product data");
      }

      // Set the fetched product as "My Product"
      setProduct(data.product);

      // All OTHER products from search become competitors (ne koristimo data.suggestedCompetitors)
      const competitorsFromSearch = searchResults
        .filter((p) => p.asin !== selectedProduct.asin)
        .map((p) => ({ ...p, source: "search" }));

      setCompetitors(competitorsFromSearch);

      // Auto-select all competitors
      setSelectedCompetitors(competitorsFromSearch.map((c) => c.asin));

      setFetchStats({
        competitorsFound: competitorsFromSearch.length,
        primarySource: "search",
        sources: {
          search: competitorsFromSearch.length,
        },
      });

      setStep("competitors");
    } catch (err: any) {
      setError(err.message || "Failed to load product");
      setStep("select_my_product");
    } finally {
      setLoading(false);
    }
  };

  const toggleCompetitor = (asin: string) => {
    setSelectedCompetitors((prev) =>
      prev.includes(asin) ? prev.filter((a) => a !== asin) : [...prev, asin]
    );
  };

  const handleConfirm = async () => {
    setLoading(true);
    setStep("saving");
    setSavingProgress("Saving competitors...");

    try {
      const competitorData = competitors
        .filter((c) => selectedCompetitors.includes(c.asin))
        .map((c) => ({
          asin: c.asin,
          title: c.title,
          price: c.price,
          currency: c.currency,
          rating: c.rating,
          ratingsTotal: c.ratingsTotal,
          imageUrl: c.imageUrl,
          link: c.link,
          brand: c.brand,
        }));

      setSavingProgress(`Saving ${selectedCompetitors.length} competitors...`);

      const response = await fetch(
        `/api/folders/${folderId}/comparison/competitors`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            competitorAsins: selectedCompetitors,
            competitorData: competitorData,
            marketplace,
            fetchInBackground: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save competitors");
      }

      setSavingProgress("Updating comparison...");

      // ✅ OPCIONO: Update folder name (skip ako vraća 404)
      try {
        await fetch(`/api/folders/${folderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${product.title.substring(0, 40)}... Analysis`,
          }),
        });
      } catch (err) {
        console.log("Folder update skipped (endpoint may not exist)");
      }

      setSavingProgress("Complete!");

      const selectedComps = competitors.filter((c) =>
        selectedCompetitors.includes(c.asin)
      );
      onProductAdded(product, selectedComps);

      setTimeout(() => {
        resetFlow();
      }, 500);
    } catch (err: any) {
      setError(err.message || "Failed to confirm");
      setStep("competitors");
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setIsOpen(false);
    setStep("method");
    setAsin("");
    setSearchQuery("");
    setProduct(null);
    setCompetitors([]);
    setSelectedCompetitors([]);
    setSearchResults([]);
    setError("");
    setSavingProgress("");
    setFetchStats(null);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center gap-2 font-medium shadow-lg shadow-blue-500/30"
      >
        <Plus className="h-4 w-4" />
        Add Product
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold">Add Product</h2>
          <button
            onClick={resetFlow}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Loading State */}
          {step === "loading" && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchResults.length > 0
                  ? "Loading Product Details..."
                  : "Fetching Product Data..."}
              </h3>
              <p className="text-slate-600">
                {searchResults.length > 0
                  ? "Getting full product information"
                  : "Getting product details and finding related products"}
              </p>
            </div>
          )}

          {/* Saving State */}
          {step === "saving" && (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-emerald-500 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold mb-2">{savingProgress}</h3>
              <p className="text-slate-600">
                Full competitor data will load in the background
              </p>
            </div>
          )}

          {/* Method Selection */}
          {step === "method" && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setStep("asin")}
                className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 hover:border-blue-400 bg-white p-8 text-left transition-all hover:shadow-xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform" />
                <Package className="h-10 w-10 text-blue-500 mb-4" />
                <h3 className="font-bold text-lg mb-2">Add by ASIN</h3>
                <p className="text-sm text-slate-600">
                  Enter a specific Amazon ASIN to get related products
                </p>
              </button>

              <button
                onClick={() => setStep("search")}
                className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 hover:border-purple-400 bg-white p-8 text-left transition-all hover:shadow-xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform" />
                <Search className="h-10 w-10 text-purple-500 mb-4" />
                <h3 className="font-bold text-lg mb-2">Search Products</h3>
                <p className="text-sm text-slate-600">
                  Search Amazon and select your product from results
                </p>
              </button>
            </div>
          )}

          {/* ASIN Entry */}
          {step === "asin" && (
            <div className="space-y-6">
              <button
                onClick={() => setStep("method")}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                ← Back to methods
              </button>

              <div>
                <h3 className="text-xl font-bold mb-2">Enter Product ASIN</h3>
                <p className="text-slate-600">
                  We'll find related products automatically
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Marketplace
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {marketplaces.map((mp) => (
                      <button
                        key={mp.code}
                        onClick={() => setMarketplace(mp.code)}
                        className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          marketplace === mp.code
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {mp.flag} {mp.code}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">ASIN</label>
                  <input
                    type="text"
                    value={asin}
                    onChange={(e) => setAsin(e.target.value.toUpperCase())}
                    placeholder="B0XXXXXX"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none text-lg font-mono"
                    maxLength={10}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleFetchByASIN();
                    }}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleFetchByASIN}
                  disabled={loading || !asin.trim()}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Fetching product...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      Fetch Product & Related Items
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Search View */}
          {step === "search" && (
            <div className="space-y-6">
              <button
                onClick={() => setStep("method")}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                ← Back to methods
              </button>

              <div>
                <h3 className="text-xl font-bold mb-2">
                  Search Amazon Products
                </h3>
                <p className="text-slate-600">
                  Search by keywords, brand, or category
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Marketplace
                  </label>
                  <select
                    value={marketplace}
                    onChange={(e) => setMarketplace(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  >
                    {marketplaces.map((mp) => (
                      <option key={mp.code} value={mp.code}>
                        {mp.flag} {mp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Search Query
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="cooling face mask, wireless headphones, Sony..."
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearchProducts();
                    }}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSearchProducts}
                  disabled={loading || !searchQuery.trim()}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      Search Products
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Select My Product Step */}
          {step === "select_my_product" && (
            <div className="space-y-6">
              <button
                onClick={() => setStep("search")}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                ← Back to search
              </button>

              <div>
                <h3 className="text-xl font-bold mb-2">Select Your Product</h3>
                <p className="text-slate-600">
                  Choose which product is yours. Other products will become
                  competitors.
                </p>
                <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  Found {searchResults.length} products
                </div>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {searchResults.map((product) => (
                  <button
                    key={product.asin}
                    onClick={() => handleSelectMyProduct(product)}
                    disabled={loading}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-left"
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-20 h-20 object-contain rounded bg-slate-50 flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm mb-2 line-clamp-2">
                        {product.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                        <span className="font-bold text-base">
                          ${product.price}
                        </span>
                        {product.rating > 0 && (
                          <>
                            <span>★ {product.rating}</span>
                            <span>
                              {product.ratingsTotal?.toLocaleString()} reviews
                            </span>
                          </>
                        )}
                        {product.isPrime && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            Prime
                          </span>
                        )}
                      </div>
                      {product.brand && (
                        <div className="mt-1 text-xs text-slate-500">
                          Brand: {product.brand}
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      <div className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 transition-colors">
                        Select This →
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Competitors Selection */}
          {step === "competitors" && (
            <div className="space-y-6">
              {/* My Product */}
              {product && (
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border-2 border-emerald-300 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-bold text-emerald-900">Your Product</h3>
                  </div>
                  <div className="flex gap-4">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-24 h-24 object-contain rounded-lg bg-white"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1 line-clamp-2">
                        {product.title}
                      </h4>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-bold text-emerald-700">
                          ${product.price}
                        </span>
                        {product.rating > 0 && (
                          <>
                            <span>★ {product.rating}</span>
                            <span className="text-slate-600">
                              {product.ratingsTotal?.toLocaleString()} reviews
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats */}
              {fetchStats && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-blue-900 text-sm">
                      Related Products Found
                    </h4>
                  </div>
                  <p className="text-xs text-blue-700">
                    {fetchStats.sources?.similar_to_consider > 0 && (
                      <span className="font-medium">
                        {fetchStats.sources.similar_to_consider} from Related
                        Products
                      </span>
                    )}
                    {fetchStats.sources?.also_viewed > 0 && (
                      <span className="font-medium ml-2">
                        {fetchStats.sources?.similar_to_consider > 0 && "+ "}
                        {fetchStats.sources.also_viewed} from "Also Viewed"
                      </span>
                    )}
                    {fetchStats.sources?.also_bought > 0 && (
                      <span className="font-medium ml-2">
                        + {fetchStats.sources.also_bought} from "Also Bought"
                      </span>
                    )}
                    {fetchStats.sources?.frequently_bought_together > 0 && (
                      <span className="font-medium ml-2">
                        + {fetchStats.sources.frequently_bought_together} bought
                        together
                      </span>
                    )}
                    {fetchStats.sources?.category_search > 0 && (
                      <span className="font-medium ml-2">
                        + {fetchStats.sources.category_search} from similar
                        category
                      </span>
                    )}
                    {fetchStats.sources?.search > 0 && (
                      <span className="font-medium">
                        {fetchStats.sources.search} from search results
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Competitors List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">
                    {competitors.length === 0 ? (
                      "No Competitors Found"
                    ) : (
                      <>
                        Related Products ({selectedCompetitors.length}/
                        {competitors.length} selected)
                      </>
                    )}
                  </h3>
                  {competitors.length > 0 && (
                    <button
                      onClick={() => {
                        if (selectedCompetitors.length === competitors.length) {
                          setSelectedCompetitors([]);
                        } else {
                          setSelectedCompetitors(
                            competitors.map((c) => c.asin)
                          );
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {selectedCompetitors.length === competitors.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  )}
                </div>

                {competitors.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                    <Package className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">
                      No related products found
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Try searching manually or choosing a different product
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {competitors.map((comp) => {
                      const sourceBadge = getSourceBadge(comp.source);

                      return (
                        <button
                          key={comp.asin}
                          onClick={() => toggleCompetitor(comp.asin)}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                            selectedCompetitors.includes(comp.asin)
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              selectedCompetitors.includes(comp.asin)
                                ? "border-blue-500 bg-blue-500"
                                : "border-slate-300"
                            }`}
                          >
                            {selectedCompetitors.includes(comp.asin) && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                              </svg>
                            )}
                          </div>

                          <img
                            src={comp.imageUrl}
                            alt={comp.title}
                            className="w-16 h-16 object-contain rounded bg-slate-50 flex-shrink-0"
                          />

                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm mb-1 line-clamp-2">
                              {comp.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                              <span className="font-semibold">
                                ${comp.price}
                              </span>
                              {comp.rating > 0 && (
                                <>
                                  <span>★ {comp.rating}</span>
                                  <span>
                                    {comp.ratingsTotal?.toLocaleString()}{" "}
                                    reviews
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Source Badge */}
                            <div
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${sourceBadge.color}`}
                            >
                              {sourceBadge.icon}
                              {sourceBadge.label}
                            </div>
                          </div>

                          {comp.score && (
                            <div className="text-right flex-shrink-0">
                              <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                                {comp.score}% Match
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setStep("method")}
                    className="px-6 py-3 border-2 border-slate-300 rounded-xl font-medium hover:bg-slate-50"
                  >
                    Start Over
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={loading || selectedCompetitors.length === 0}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      `Confirm & Analyze (${selectedCompetitors.length} products)`
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
