// app/folders/[id]/components/AddCompetitorsFlow.tsx
// ✅ Standalone flow for adding competitors ONLY (doesn't touch My Product)

"use client";

import React, { useState } from "react";
import {
  Search,
  Package,
  Loader2,
  CheckCircle2,
  Plus,
  X,
  Upload,
  Edit3,
  Eye,
  ShoppingCart,
  ShoppingBag,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

type AddCompetitorsFlowProps = {
  folderId: string;
  onCompetitorsAdded: () => void;
};

export function AddCompetitorsFlow({
  folderId,
  onCompetitorsAdded,
}: AddCompetitorsFlowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<
    | "method"
    | "asin"
    | "multi_asin"
    | "manual"
    | "search"
    | "loading"
    | "select"
    | "saving"
  >("method");

  const [asin, setAsin] = useState("");
  const [multiAsinInput, setMultiAsinInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [marketplace, setMarketplace] = useState("com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [foundProducts, setFoundProducts] = useState<any[]>([]);
  const [selectedAsins, setSelectedAsins] = useState<string[]>([]);

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
          label: "Related",
          color: "bg-purple-100 text-purple-700 border-purple-200",
        };
      case "also_viewed":
        return {
          icon: <Eye className="h-3 w-3" />,
          label: "Also Viewed",
          color: "bg-blue-100 text-blue-700 border-blue-200",
        };
      case "search":
        return {
          icon: <Search className="h-3 w-3" />,
          label: "Search",
          color: "bg-indigo-100 text-indigo-700 border-indigo-200",
        };
      case "manual":
        return {
          icon: <Edit3 className="h-3 w-3" />,
          label: "Manual",
          color: "bg-amber-100 text-amber-700 border-amber-200",
        };
      default:
        return {
          icon: <Package className="h-3 w-3" />,
          label: "Product",
          color: "bg-slate-100 text-slate-700 border-slate-200",
        };
    }
  };

  // ✅ Method 1: Single ASIN with related products
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

      // ✅ Get the main product + suggested competitors
      const allProducts = [
        { ...data.product, source: "primary" },
        ...(data.suggestedCompetitors || []).map((c: any) => ({
          ...c,
          price: safeNumber(c.price, 0),
          rating: safeNumber(c.rating, 0),
          ratingsTotal: safeInt(c.ratingsTotal, 0),
        })),
      ];

      setFoundProducts(allProducts);
      setSelectedAsins(allProducts.map((p: any) => p.asin));
      setStep("select");
    } catch (err: any) {
      setError(err.message || "Failed to fetch product");
      setStep("asin");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Method 2: Multi-ASIN (paste list)
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
        body: JSON.stringify({ asins, marketplace, folderId }),
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

      const allProducts = data.products.map((p: any) => ({
        ...p,
        source: "manual",
        price: safeNumber(p.price, 0),
        rating: safeNumber(p.rating, 0),
        ratingsTotal: safeInt(p.ratingsTotal, 0),
      }));

      setFoundProducts(allProducts);
      setSelectedAsins(allProducts.map((p: any) => p.asin));
      setStep("select");
    } catch (err: any) {
      setError(err.message || "Failed to fetch products");
      setStep("multi_asin");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Method 3: Search Amazon
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
        setError("No products found");
        setStep("search");
        return;
      }

      const allProducts = data.results.map((r: any) => ({
        ...r,
        source: "search",
        price: safeNumber(r.price, 0),
        rating: safeNumber(r.rating, 0),
        ratingsTotal: safeInt(r.ratingsTotal, 0),
      }));

      setFoundProducts(allProducts);
      setSelectedAsins([]);
      setStep("select");
    } catch (err: any) {
      setError(err.message || "Search failed");
      setStep("search");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Method 4: Manual entry
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

      setFoundProducts([{ ...data.product, source: "manual" }]);
      setSelectedAsins([data.product.asin]);
      setStep("select");
    } catch (err: any) {
      setError(err.message || "Failed to save product");
      setStep("manual");
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (asin: string) => {
    setSelectedAsins((prev) =>
      prev.includes(asin) ? prev.filter((a) => a !== asin) : [...prev, asin]
    );
  };

  // ✅ Save selected competitors
  const handleSaveCompetitors = async () => {
    if (selectedAsins.length === 0) {
      setError("Please select at least one product");
      return;
    }

    setLoading(true);
    setStep("saving");

    try {
      const competitorData = foundProducts
        .filter((p) => selectedAsins.includes(p.asin))
        .map((p) => ({
          asin: p.asin,
          title: p.title,
          price: p.price,
          currency: p.currency,
          rating: p.rating,
          ratingsTotal: p.ratingsTotal,
          imageUrl: p.imageUrl,
          link: p.link,
          brand: p.brand,
        }));

      const response = await fetch(
        `/api/folders/${folderId}/comparison/competitors`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            competitorAsins: selectedAsins,
            competitorData,
            marketplace,
            fetchInBackground: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save competitors");
      }

      // ✅ Success - notify parent and close
      onCompetitorsAdded();
      resetFlow();
    } catch (err: any) {
      setError(err.message || "Failed to save competitors");
      setStep("select");
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
    setFoundProducts([]);
    setSelectedAsins([]);
    setError("");
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
        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center gap-2 font-medium shadow-lg shadow-emerald-500/30"
      >
        <Users className="h-4 w-4" />
        Add Competitors
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold">Add Competitors</h2>
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
              <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Loading...</h3>
              <p className="text-slate-600">Fetching product data</p>
            </div>
          )}

          {step === "saving" && (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold mb-2">
                Saving Competitors...
              </h3>
              <p className="text-slate-600">
                Full data will load in the background
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
                <h3 className="font-bold text-lg mb-2">By ASIN</h3>
                <p className="text-sm text-slate-600">
                  Enter ASIN + get related products
                </p>
              </button>

              <button
                onClick={() => setStep("multi_asin")}
                className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 hover:border-emerald-400 bg-white p-8 text-left transition-all hover:shadow-xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform" />
                <Upload className="h-10 w-10 text-emerald-500 mb-4" />
                <h3 className="font-bold text-lg mb-2">Multi-ASIN</h3>
                <p className="text-sm text-slate-600">
                  Paste up to 10 ASINs at once
                </p>
              </button>

              <button
                onClick={() => setStep("search")}
                className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 hover:border-purple-400 bg-white p-8 text-left transition-all hover:shadow-xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform" />
                <Search className="h-10 w-10 text-purple-500 mb-4" />
                <h3 className="font-bold text-lg mb-2">Search</h3>
                <p className="text-sm text-slate-600">
                  Search Amazon and select products
                </p>
              </button>

              <button
                onClick={() => setStep("manual")}
                className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 hover:border-amber-400 bg-white p-8 text-left transition-all hover:shadow-xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform" />
                <Edit3 className="h-10 w-10 text-amber-500 mb-4" />
                <h3 className="font-bold text-lg mb-2">Manual</h3>
                <p className="text-sm text-slate-600">
                  Manually enter product details
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
                ← Back
              </button>

              <div>
                <h3 className="text-xl font-bold mb-2">Add by ASIN</h3>
                <p className="text-slate-600">
                  Fetch product + suggested competitors
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
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleFetchByASIN}
                  disabled={loading || !asin.trim()}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all"
                >
                  {loading ? "Loading..." : "Fetch Product"}
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
                ← Back
              </button>

              <div>
                <h3 className="text-xl font-bold mb-2">Multi-ASIN Import</h3>
                <p className="text-slate-600">Paste up to 10 ASINs</p>
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
                  className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 transition-all"
                >
                  {loading ? "Loading..." : "Import Products"}
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
                ← Back
              </button>

              <div>
                <h3 className="text-xl font-bold mb-2">Search Products</h3>
                <p className="text-slate-600">Search Amazon</p>
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
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 transition-all"
                >
                  {loading ? "Searching..." : "Search Amazon"}
                </button>
              </div>
            </div>
          )}

          {step === "manual" && (
            <div className="space-y-6">
              <button
                onClick={() => setStep("method")}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                ← Back
              </button>

              <div>
                <h3 className="text-xl font-bold mb-2">Manual Entry</h3>
                <p className="text-slate-600">Enter product details</p>
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
                  className="w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 transition-all"
                >
                  {loading ? "Saving..." : "Save Product"}
                </button>
              </div>
            </div>
          )}

          {step === "select" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-2">
                  Select Competitors ({selectedAsins.length} selected)
                </h3>
                <p className="text-slate-600 text-sm">
                  Choose which products to add as competitors
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
                {foundProducts.map((product) => {
                  const isSelected = selectedAsins.includes(product.asin);
                  const badge = getSourceBadge(product.source);

                  return (
                    <button
                      key={product.asin}
                      onClick={() => toggleProduct(product.asin)}
                      className={`flex items-start gap-4 p-4 border-2 rounded-xl transition-all text-left ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                          isSelected
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-slate-300"
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        )}
                      </div>

                      <img
                        src={product.imageUrl || product.image}
                        alt={product.title}
                        className="w-16 h-16 object-contain bg-white rounded-lg flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1">
                          <h4 className="font-semibold text-sm line-clamp-2 flex-1">
                            {product.title}
                          </h4>
                          <span
                            className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 flex-shrink-0 ${badge.color}`}
                          >
                            {badge.icon}
                            {badge.label}
                          </span>
                        </div>

                        {product.brand && (
                          <p className="text-xs text-slate-600 mb-2">
                            {product.brand}
                          </p>
                        )}

                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-bold">
                            ${safeNumber(product.price, 0).toFixed(2)}
                          </span>
                          {product.rating > 0 && (
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="font-semibold">
                                {safeNumber(product.rating, 0).toFixed(1)}
                              </span>
                              <span className="text-slate-500 text-xs">
                                (
                                {safeInt(
                                  product.ratingsTotal,
                                  0
                                ).toLocaleString()}
                                )
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedAsins([])}
                  className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Deselect All
                </button>
                <button
                  onClick={() =>
                    setSelectedAsins(foundProducts.map((p: any) => p.asin))
                  }
                  className="flex-1 px-4 py-3 border-2 border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
                >
                  Select All
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                onClick={handleSaveCompetitors}
                disabled={loading || selectedAsins.length === 0}
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Add {selectedAsins.length} Competitor
                    {selectedAsins.length !== 1 ? "s" : ""}
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
