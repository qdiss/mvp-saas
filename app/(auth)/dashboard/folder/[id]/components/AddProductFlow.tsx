// app/folders/[id]/components/AddProductFlow.tsx
// COMPLETE: All methods working - ASIN, Multi-ASIN, Search, Manual

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
  Edit3,
  Upload,
  Star,
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
    | "method"
    | "asin"
    | "multi_asin"
    | "manual"
    | "search"
    | "select_my_product"
    | "select_my_product_multi_asin"
    | "loading"
    | "competitors"
    | "saving"
  >("method");

  const [asin, setAsin] = useState("");
  const [multiAsinInput, setMultiAsinInput] = useState("");
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
  const [multiAsinResults, setMultiAsinResults] = useState<any[]>([]); // ✅ NEW: Store all multi-ASIN results

  // Manual entry state
  const [manualProduct, setManualProduct] = useState({
    asin: "",
    title: "",
    brand: "",
    price: "",
    link: "",
    imageUrl: "",
  });

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

  // ✅ Helper functions to safely parse numbers from API
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    if (typeof value === "number" && !isNaN(value)) return value;
    if (typeof value === "string") {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  };

  const safeInt = (value: any, defaultValue: number = 0): number => {
    if (typeof value === "number" && !isNaN(value)) return Math.floor(value);
    if (typeof value === "string") {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  };

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
      case "manual":
        return {
          icon: <Edit3 className="h-3 w-3" />,
          label: "Manual Entry",
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
          asin: asin.trim().toUpperCase(),
          marketplace,
          folderId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch product");
      }

      setProduct(data.product);

      // ✅ Parse competitors with safe numbers and remove duplicates
      const seenAsins = new Set<string>();
      const parsedCompetitors = (data.suggestedCompetitors || [])
        .filter((c: any) => {
          if (seenAsins.has(c.asin)) {
            console.log(`[ASIN FETCH] Skipping duplicate ASIN: ${c.asin}`);
            return false;
          }
          seenAsins.add(c.asin);
          return true;
        })
        .map((c: any) => ({
          ...c,
          price: safeNumber(c.price, 0),
          rating: safeNumber(c.rating, 0),
          ratingsTotal: safeInt(c.ratingsTotal, 0),
        }));

      setCompetitors(parsedCompetitors);
      setFetchStats(data.stats);
      setSelectedCompetitors(parsedCompetitors.map((c: any) => c.asin));

      setStep("competitors");
    } catch (err: any) {
      setError(err.message || "Failed to fetch product");
      setStep("asin");
    } finally {
      setLoading(false);
    }
  };

  const handleMultiASINFetch = async () => {
    const asins = multiAsinInput
      .split(/[\n,\s]+/)
      .map((a) => a.trim().toUpperCase())
      .filter((a) => a.length >= 10);

    if (asins.length === 0) {
      setError("Please enter at least one valid ASIN");
      return;
    }

    if (asins.length > 10) {
      setError("Maximum 10 ASINs allowed");
      return;
    }

    setLoading(true);
    setError("");
    setStep("loading");

    try {
      const response = await fetch("/api/products/fetch-multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asins,
          marketplace,
          folderId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch products");
      }

      if (!data.products || data.products.length === 0) {
        setError("No valid products found");
        setStep("multi_asin");
        return;
      }

      // ✅ NEW: Store all products and let user select which is "My Product"
      const seenAsins = new Set<string>();
      const allProducts = data.products
        .filter((p: any) => {
          if (seenAsins.has(p.asin)) {
            console.log(`[MULTI-ASIN] Skipping duplicate ASIN: ${p.asin}`);
            return false;
          }
          seenAsins.add(p.asin);
          return true;
        })
        .map((p: any) => ({
          ...p,
          source: "manual",
          price: safeNumber(p.price, 0),
          rating: safeNumber(p.rating, 0),
          ratingsTotal: safeInt(p.ratingsTotal, 0),
        }));

      setMultiAsinResults(allProducts);
      setStep("select_my_product_multi_asin");
    } catch (err: any) {
      setError(err.message || "Failed to fetch products");
      setStep("multi_asin");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Handle selection of "My Product" from multi-ASIN results
  const handleSelectMyProductFromMultiAsin = async (selectedProduct: any) => {
    setLoading(true);
    setStep("loading");

    try {
      // ✅ CRITICAL: Fetch the selected product as "My Product" with isMyProduct=TRUE
      console.log(
        `[MULTI-ASIN SELECT] Fetching ${selectedProduct.asin} as My Product...`
      );

      const response = await fetch("/api/products/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asin: selectedProduct.asin,
          marketplace,
          folderId,
          skipRelatedProducts: true, // We already have competitors from multi-ASIN
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch product");
      }

      // Set the fetched product (now with full data from API)
      setProduct(data.product);

      // All other products become competitors (auto-selected)
      const competitorsFromMultiAsin = multiAsinResults
        .filter((p) => p.asin !== selectedProduct.asin)
        .map((p) => ({ ...p, source: "manual" }));

      setCompetitors(competitorsFromMultiAsin);
      setSelectedCompetitors(competitorsFromMultiAsin.map((c) => c.asin));

      setFetchStats({
        competitorsFound: competitorsFromMultiAsin.length,
        primarySource: "multi_asin",
        sources: { manual: competitorsFromMultiAsin.length },
      });

      setStep("competitors");
    } catch (err: any) {
      setError(err.message || "Failed to fetch product");
      setStep("select_my_product_multi_asin");
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = async () => {
    if (!manualProduct.asin.trim() || !manualProduct.title.trim()) {
      setError("ASIN and Title are required");
      return;
    }

    setLoading(true);
    setError("");
    setStep("loading");

    try {
      const response = await fetch("/api/products/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manualProduct,
          asin: manualProduct.asin.trim().toUpperCase(),
          marketplace,
          folderId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save product");
      }

      setProduct(data.product);
      setCompetitors([]);
      setSelectedCompetitors([]);
      setFetchStats({
        competitorsFound: 0,
        primarySource: "manual",
        sources: { manual: 1 },
      });

      setStep("competitors");
    } catch (err: any) {
      setError(err.message || "Failed to save product");
      setStep("manual");
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

      // ✅ Parse search results with safe number conversion
      const parsedResults = data.results.map((r: any) => ({
        ...r,
        price: safeNumber(r.price, 0),
        rating: safeNumber(r.rating, 0),
        ratingsTotal: safeInt(r.ratingsTotal, 0),
      }));

      setSearchResults(parsedResults);
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
      const response = await fetch("/api/products/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asin: selectedProduct.asin,
          marketplace,
          folderId,
          skipRelatedProducts: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch full product data");
      }

      setProduct(data.product);

      // ✅ Parse competitors from search with safe numbers and remove duplicates
      const seenAsins = new Set<string>();
      const competitorsFromSearch = searchResults
        .filter((p) => {
          if (p.asin === selectedProduct.asin) return false;
          if (seenAsins.has(p.asin)) {
            console.log(`[SEARCH] Skipping duplicate ASIN: ${p.asin}`);
            return false;
          }
          seenAsins.add(p.asin);
          return true;
        })
        .map((p) => ({
          ...p,
          source: "search",
          price: safeNumber(p.price, 0),
          rating: safeNumber(p.rating, 0),
          ratingsTotal: safeInt(p.ratingsTotal, 0),
        }));

      setCompetitors(competitorsFromSearch);
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

      try {
        await fetch(`/api/folders/${folderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${product.title.substring(0, 40)}... Analysis`,
          }),
        });
      } catch (err) {
        console.log("Folder update skipped");
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
    setMultiAsinInput("");
    setSearchQuery("");
    setProduct(null);
    setCompetitors([]);
    setSelectedCompetitors([]);
    setSearchResults([]);
    setMultiAsinResults([]); // ✅ Reset multi-ASIN results
    setError("");
    setSavingProgress("");
    setFetchStats(null);
    setManualProduct({
      asin: "",
      title: "",
      brand: "",
      price: "",
      link: "",
      imageUrl: "",
    });
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

          {step === "saving" && (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-emerald-500 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold mb-2">{savingProgress}</h3>
              <p className="text-slate-600">
                Full competitor data will load in the background
              </p>
            </div>
          )}

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
                onClick={() => setStep("multi_asin")}
                className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 hover:border-emerald-400 bg-white p-8 text-left transition-all hover:shadow-xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform" />
                <Upload className="h-10 w-10 text-emerald-500 mb-4" />
                <h3 className="font-bold text-lg mb-2">Multi-ASIN Import</h3>
                <p className="text-sm text-slate-600">
                  Paste up to 10 ASINs at once (comma or newline separated)
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

              <button
                onClick={() => setStep("manual")}
                className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 hover:border-amber-400 bg-white p-8 text-left transition-all hover:shadow-xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform" />
                <Edit3 className="h-10 w-10 text-amber-500 mb-4" />
                <h3 className="font-bold text-lg mb-2">Manual Entry</h3>
                <p className="text-sm text-slate-600">
                  Manually enter product details (useful for testing)
                </p>
              </button>
            </div>
          )}

          {step === "asin" && (
            <div className="space-y-6">
              <button
                onClick={() => setStep("method")}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                ← Back to methods
              </button>

              <div>
                <h3 className="text-xl font-bold mb-2">Add by ASIN</h3>
                <p className="text-slate-600">
                  Enter an Amazon ASIN to fetch product details and find
                  competitors
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
                    onKeyPress={(e) => e.key === "Enter" && handleFetchByASIN()}
                    placeholder="B0XXXXXXXXXX"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none font-mono text-lg"
                    maxLength={10}
                    autoFocus
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Example: B09V3KXJPB
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleFetchByASIN}
                  disabled={loading || !asin.trim()}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Fetching product...
                    </>
                  ) : (
                    <>
                      <Package className="h-5 w-5" />
                      Fetch Product
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === "multi_asin" && (
            <div className="space-y-6">
              <button
                onClick={() => setStep("method")}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                ← Back to methods
              </button>

              <div>
                <h3 className="text-xl font-bold mb-2">Multi-ASIN Import</h3>
                <p className="text-slate-600">
                  Paste up to 10 ASINs (one per line or comma-separated)
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
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {mp.flag} {mp.code}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    ASINs (max 10)
                  </label>
                  <textarea
                    value={multiAsinInput}
                    onChange={(e) => setMultiAsinInput(e.target.value)}
                    placeholder="B0XXXXXXXXXX&#10;B0YYYYYYYYYY&#10;B0ZZZZZZZZZZ"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none font-mono text-sm"
                    rows={8}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    {
                      multiAsinInput
                        .split(/[\n,\s]+/)
                        .filter((a) => a.trim().length >= 10).length
                    }{" "}
                    ASINs detected
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleMultiASINFetch}
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Fetching products...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Import Products
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === "search" && (
            <div className="space-y-6">
              <button
                onClick={() => setStep("method")}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                ← Back to methods
              </button>

              <div>
                <h3 className="text-xl font-bold mb-2">Search Products</h3>
                <p className="text-slate-600">
                  Search Amazon to find your product
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
                            ? "border-purple-500 bg-purple-50 text-purple-700"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {mp.flag} {mp.code}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Search Query
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleSearchProducts()
                    }
                    placeholder="e.g., wireless headphones"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    autoFocus
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
                      Search Amazon
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

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
                  Found {searchResults.length} products. Select your main
                  product:
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.asin}
                    onClick={() => handleSelectMyProduct(result)}
                    className="flex items-start gap-4 p-4 border-2 border-slate-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all text-left"
                  >
                    <img
                      src={result.imageUrl}
                      alt={result.title}
                      className="w-20 h-20 object-contain bg-white rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold line-clamp-2 mb-1">
                        {result.title}
                      </h4>
                      {result.brand && (
                        <p className="text-sm text-slate-600 mb-2">
                          {result.brand}
                        </p>
                      )}
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="font-bold text-lg">
                          ${safeNumber(result.price, 0).toFixed(2)}
                        </span>
                        {result.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="font-semibold">
                              {safeNumber(result.rating, 0).toFixed(1)}
                            </span>
                            <span className="text-slate-500 text-sm">
                              (
                              {safeInt(result.ratingsTotal, 0).toLocaleString()}
                              )
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ✅ NEW: Select "My Product" from multi-ASIN results */}
          {step === "select_my_product_multi_asin" && (
            <div className="space-y-6">
              <button
                onClick={() => setStep("multi_asin")}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                ← Back to ASINs
              </button>

              <div>
                <h3 className="text-xl font-bold mb-2">Select Your Product</h3>
                <p className="text-slate-600">
                  Found {multiAsinResults.length} products. Click on your main
                  product:
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto">
                {multiAsinResults.map((result) => (
                  <button
                    key={result.asin}
                    onClick={() => handleSelectMyProductFromMultiAsin(result)}
                    className="flex items-start gap-4 p-4 border-2 border-slate-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all text-left group"
                  >
                    {/* Checkmark indicator on hover */}
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>

                    <img
                      src={result.imageUrl || result.image}
                      alt={result.title}
                      className="w-20 h-20 object-contain bg-white rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold line-clamp-2 mb-1">
                        {result.title}
                      </h4>
                      {result.brand && (
                        <p className="text-sm text-slate-600 mb-2">
                          by {result.brand}
                        </p>
                      )}
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="font-bold text-lg">
                          ${safeNumber(result.price, 0).toFixed(2)}
                        </span>
                        {result.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="font-semibold">
                              {safeNumber(result.rating, 0).toFixed(1)}
                            </span>
                            <span className="text-slate-500 text-sm">
                              (
                              {safeInt(result.ratingsTotal, 0).toLocaleString()}
                              )
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-full">
                          ASIN: {result.asin}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">i</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">
                      How it works
                    </h4>
                    <p className="text-sm text-blue-700">
                      Click on the product you want to analyze (Your Product).
                      All other products will automatically become competitors,
                      which you can deselect on the next screen if needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "manual" && (
            <div className="space-y-6">
              <button
                onClick={() => setStep("method")}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                ← Back to methods
              </button>

              <div>
                <h3 className="text-xl font-bold mb-2">Manual Product Entry</h3>
                <p className="text-slate-600">Enter product details manually</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    ASIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={manualProduct.asin}
                    onChange={(e) =>
                      setManualProduct({
                        ...manualProduct,
                        asin: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="B0XXXXXXXXXX"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-amber-500 focus:outline-none font-mono"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={manualProduct.title}
                    onChange={(e) =>
                      setManualProduct({
                        ...manualProduct,
                        title: e.target.value,
                      })
                    }
                    placeholder="Product name"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={manualProduct.brand}
                      onChange={(e) =>
                        setManualProduct({
                          ...manualProduct,
                          brand: e.target.value,
                        })
                      }
                      placeholder="Brand name"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualProduct.price}
                      onChange={(e) =>
                        setManualProduct({
                          ...manualProduct,
                          price: e.target.value,
                        })
                      }
                      placeholder="19.99"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Product Link
                  </label>
                  <input
                    type="url"
                    value={manualProduct.link}
                    onChange={(e) =>
                      setManualProduct({
                        ...manualProduct,
                        link: e.target.value,
                      })
                    }
                    placeholder="https://amazon.com/dp/B0XXXXXXXXXX"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={manualProduct.imageUrl}
                    onChange={(e) =>
                      setManualProduct({
                        ...manualProduct,
                        imageUrl: e.target.value,
                      })
                    }
                    placeholder="https://m.media-amazon.com/images/..."
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleManualEntry}
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-5 w-5" />
                      Save Product
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === "competitors" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="h-8 w-8 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Product Added!</h3>
                    <p className="text-emerald-100 text-sm mb-3">
                      {product.title}
                    </p>
                    {fetchStats && (
                      <div className="text-sm text-emerald-100">
                        Found {competitors.length} potential competitors
                        {fetchStats.primarySource &&
                          ` (primary source: ${fetchStats.primarySource})`}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {competitors.length > 0 ? (
                <>
                  <div>
                    <h3 className="text-lg font-bold mb-2">
                      Select Competitors ({selectedCompetitors.length} selected)
                    </h3>
                    <p className="text-slate-600 text-sm">
                      Choose which products to compare with yours
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
                    {competitors.map((comp) => {
                      const isSelected = selectedCompetitors.includes(
                        comp.asin
                      );
                      const badge = getSourceBadge(comp.source);

                      return (
                        <button
                          key={comp.asin}
                          onClick={() => toggleCompetitor(comp.asin)}
                          className={`flex items-start gap-4 p-4 border-2 rounded-xl transition-all text-left ${
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                              isSelected
                                ? "bg-blue-500 border-blue-500"
                                : "border-slate-300"
                            }`}
                          >
                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            )}
                          </div>

                          <img
                            src={comp.imageUrl}
                            alt={comp.title}
                            className="w-16 h-16 object-contain bg-white rounded-lg flex-shrink-0"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1">
                              <h4 className="font-semibold text-sm line-clamp-2 flex-1">
                                {comp.title}
                              </h4>
                              <span
                                className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 flex-shrink-0 ${badge.color}`}
                              >
                                {badge.icon}
                                {badge.label}
                              </span>
                            </div>

                            {comp.brand && (
                              <p className="text-xs text-slate-600 mb-2">
                                {comp.brand}
                              </p>
                            )}

                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="font-bold">
                                ${safeNumber(comp.price, 0).toFixed(2)}
                              </span>
                              {comp.rating > 0 && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  <span className="font-semibold">
                                    {safeNumber(comp.rating, 0).toFixed(1)}
                                  </span>
                                  <span className="text-slate-500 text-xs">
                                    (
                                    {safeInt(
                                      comp.ratingsTotal,
                                      0
                                    ).toLocaleString()}
                                    )
                                  </span>
                                </div>
                              )}
                              {comp.score && (
                                <span className="text-xs text-slate-500">
                                  Match: {comp.score}%
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedCompetitors([])}
                      className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                    >
                      Deselect All
                    </button>
                    <button
                      onClick={() =>
                        setSelectedCompetitors(competitors.map((c) => c.asin))
                      }
                      className="flex-1 px-4 py-3 border-2 border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                    >
                      Select All
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <Package className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">
                    No competitors found
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    You can add competitors later
                  </p>
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    {selectedCompetitors.length > 0
                      ? `Continue with ${
                          selectedCompetitors.length
                        } competitor${
                          selectedCompetitors.length !== 1 ? "s" : ""
                        }`
                      : "Continue without competitors"}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
