// app/folders/[id]/page.tsx
"use client";

import React, { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Loader2 } from "lucide-react";
import { AddProductFlow } from "./components/AddProductFlow";
import { Product, TabType } from "@/types";
import { Header } from "./components/Header";
import { StatsCards } from "./components/StatsCards";
import { TabNavigation } from "./components/TabNavigation";
import { OverviewTab } from "./components/tabs/OverviewTab";
import { ImagesTab } from "./components/tabs/ImagesTab";
import { PricingTab } from "./components/tabs/PricingTab";
import { ContentTab } from "./components/tabs/ContentTab";
import { DebugDataView } from "./components/DebugDataView";
import { CompleteProductView } from "./components/CompleteProductView";

export default function CompetitiveAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: folderId } = use(params);

  const [myProduct, setMyProduct] = useState<Product>({
    id: "my-1",
    name: "",
    price: 0,
    rating: 0,
    reviews: 0,
    photos: [],
  });

  const [competitors, setCompetitors] = useState<Product[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabType>("overview");
  const [folderSettings, setFolderSettings] = useState({
    name: "Untitled Folder",
    category: "",
    description: "",
  });

  const [comparisonId, setComparisonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // NOVO: Pending state za cached selection
  const [pendingSelection, setPendingSelection] = useState<{
    product: any;
    competitors: any[];
  } | null>(null);

  // Load existing comparison on mount
  useEffect(() => {
    loadExistingComparison();

    // NOVO: Load pending selection iz localStorage
    const cached = localStorage.getItem(`pending-selection-${folderId}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setPendingSelection(parsed);
      } catch (e) {
        console.error("Failed to parse cached selection:", e);
      }
    }
  }, [folderId]);

  const loadExistingComparison = async () => {
    try {
      setLoading(true);

      // Učitaj comparison sa SVIM podacima
      const response = await fetch(`/api/folders/${folderId}/comparison`);

      if (response.ok) {
        const data = await response.json();

        console.log("Loaded comparison data:", data);

        if (data.comparison) {
          const { comparison } = data;
          setComparisonId(comparison.id);

          // Set main product SA SVIM PODACIMA
          if (comparison.primaryProduct) {
            const product = comparison.primaryProduct;

            setMyProduct({
              id: product.asin,
              name: product.title,
              price: parseFloat(product.price || "0"),
              rating: parseFloat(product.rating || "0"),
              reviews: product.ratingsTotal || 0,

              // SVE SLIKE
              photos: product.images?.map((img: any) => img.imageUrl) || [],

              // DODATNI PODACI
              asin: product.asin,
              brand: product.brand,
              link: product.link,
              selected: true,

              // FEATURE BULLETS
              features: product.featureBullets || [],

              // SPECIFICATIONS
              specifications: product.specifications || [],

              // AVAILABILITY
              inStock: product.isInStock,
              isPrime: product.isPrime,

              // BESTSELLER RANK
              bestsellerRank: product.bestsellerRank,

              // CATEGORY
              category: product.categoriesFlat,

              // PRICING DETAILS
              rrpValue: parseFloat(product.rrpValue || "0"),
              savingsAmount: parseFloat(product.savingsAmount || "0"),
              savingsPercent: parseFloat(product.savingsPercent || "0"),
              hasCoupon: product.hasCoupon,
              couponText: product.couponText,

              // RAW DATA (za detaljnu analizu)
              rawData: product.rawData,
            });
          }

          // Set competitors SA SVIM PODACIMA
          if (comparison.competitorProducts?.length > 0) {
            setCompetitors(
              comparison.competitorProducts.map((comp: any) => ({
                id: comp.asin,
                name: comp.title,
                price: parseFloat(comp.price || "0"),
                rating: parseFloat(comp.rating || "0"),
                reviews: comp.ratingsTotal || 0,

                // SVE SLIKE
                photos: comp.images?.map((img: any) => img.imageUrl) || [],

                // DODATNI PODACI
                asin: comp.asin,
                brand: comp.brand,
                link: comp.link,
                selected: true,

                // MATCH SCORE
                matchScore: comp.matchScore
                  ? parseFloat(comp.matchScore)
                  : null,

                // FEATURE BULLETS
                features: comp.featureBullets || [],

                // SPECIFICATIONS
                specifications: comp.specifications || [],

                // AVAILABILITY
                inStock: comp.isInStock,
                isPrime: comp.isPrime,

                // BESTSELLER RANK
                bestsellerRank: comp.bestsellerRank,

                // CATEGORY
                category: comp.categoriesFlat,

                // PRICING DETAILS
                rrpValue: parseFloat(comp.rrpValue || "0"),
                savingsAmount: parseFloat(comp.savingsAmount || "0"),
                savingsPercent: parseFloat(comp.savingsPercent || "0"),
                hasCoupon: comp.hasCoupon,
                couponText: comp.couponText,

                // RAW DATA
                rawData: comp.rawData,

                // METADATA
                addedAt: comp.addedAt,
                position: comp.position,
              }))
            );
          }

          // Set folder name
          setFolderSettings((prev) => ({
            ...prev,
            name: comparison.name || prev.name,
          }));
        }
      }

      // Takođe učitaj folder details
      const folderResponse = await fetch(`/api/folders/${folderId}`);
      if (folderResponse.ok) {
        const folderData = await folderResponse.json();

        if (folderData.folder) {
          setFolderSettings({
            name: folderData.folder.name,
            category: folderData.folder.category || "",
            description: folderData.folder.description || "",
          });
        }
      }
    } catch (error) {
      console.error("Error loading comparison:", error);
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  };

  const toggleCompetitor = (id: string) => {
    setCompetitors((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const updateCompetitor = (id: string, updater: (p: Product) => Product) => {
    setCompetitors((prev) => prev.map((p) => (p.id === id ? updater(p) : p)));
  };

  // Handle new product added from AddProductFlow
  const handleProductAdded = async (
    product: any,
    selectedCompetitors: any[]
  ) => {
    console.log("Product added:", product);
    console.log("Selected competitors:", selectedCompetitors);

    // NOVO: Sačuvaj u localStorage za cache
    const selectionData = {
      product,
      competitors: selectedCompetitors,
      timestamp: Date.now(),
    };
    localStorage.setItem(
      `pending-selection-${folderId}`,
      JSON.stringify(selectionData)
    );
    setPendingSelection(selectionData);

    // Set main product in UI
    setMyProduct({
      id: product.asin,
      name: product.title,
      price: parseFloat(product.price || "0"),
      rating: parseFloat(product.rating || "0"),
      reviews: product.ratingsTotal || 0,
      photos: product.images || [product.imageUrl],
      selected: true,
      asin: product.asin,
      brand: product.brand,
      link: product.link,
    });

    // Set competitors in UI
    setCompetitors(
      selectedCompetitors.map((comp) => ({
        id: comp.asin,
        name: comp.title,
        price: comp.price,
        rating: comp.rating,
        reviews: comp.ratingsTotal,
        photos: [comp.imageUrl],
        selected: true,
        asin: comp.asin,
        matchScore: comp.score,
      }))
    );

    // Update folder name
    setFolderSettings((prev) => ({
      ...prev,
      name: `${product.title.substring(0, 40)}... Analysis`,
    }));

    // Update comparison ID
    if (product.comparisonId) {
      setComparisonId(product.comparisonId);
    }

    // NE reload-uj odmah, čekaj Confirm
  };

  // NOVO: Confirm selection i reload
  const handleConfirmSelection = async () => {
    if (!pendingSelection) return;

    setLoading(true);

    // Clear cache
    localStorage.removeItem(`pending-selection-${folderId}`);
    setPendingSelection(null);

    // Reload from database da dobiješ SVE podatke
    await loadExistingComparison();

    setLoading(false);
  };

  // NOVO: Cancel selection
  const handleCancelSelection = () => {
    localStorage.removeItem(`pending-selection-${folderId}`);
    setPendingSelection(null);
    setMyProduct({
      id: "my-1",
      name: "",
      price: 0,
      rating: 0,
      reviews: 0,
      photos: [],
    });
    setCompetitors([]);
  };

  const selectedCompetitors = competitors.filter((c) => c.selected);
  const hasProducts = myProduct.name || competitors.length > 0;
  const hasPendingSelection = pendingSelection !== null;

  // Loading state
  if (loading && !initialLoadComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading comparison...</p>
        </div>
      </div>
    );
  }

  // NOVO: Pending Selection State (nakon što odabereš, pre confirm)
  if (hasPendingSelection && !hasProducts) {
    const { product, competitors: pendingCompetitors } = pendingSelection;

    return (
      <div className="min-h-screen p-6">
        <div className="max-w-[1400px] mx-auto">
          <header className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60 rounded-lg transition-colors"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold">
                  {folderSettings.name}
                </h1>
                <p className="text-sm text-yellow-600 dark:text-yellow-500">
                  ⚠️ Selection pending - Click "Confirm" to save
                </p>
              </div>
            </div>
          </header>

          {/* Preview Selection */}
          <div className="rounded-xl border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              Review Your Selection
            </h2>

            {/* My Product Preview */}
            <div className="mb-4 p-4 bg-white dark:bg-slate-800 rounded-lg">
              <div className="text-xs font-semibold text-blue-600 mb-2">
                YOUR PRODUCT
              </div>
              <div className="flex gap-3">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-16 h-16 object-contain rounded"
                />
                <div>
                  <h3 className="font-medium text-sm line-clamp-2">
                    {product.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    ${product.price} • ★ {product.rating}
                  </p>
                </div>
              </div>
            </div>

            {/* Competitors Preview */}
            {pendingCompetitors.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-green-600 mb-2">
                  SELECTED COMPETITORS ({pendingCompetitors.length})
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {pendingCompetitors.slice(0, 4).map((comp: any) => (
                    <div
                      key={comp.asin}
                      className="p-2 bg-white dark:bg-slate-800 rounded flex gap-2"
                    >
                      <img
                        src={comp.imageUrl}
                        alt={comp.title}
                        className="w-12 h-12 object-contain rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium line-clamp-1">
                          {comp.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${comp.price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {pendingCompetitors.length > 4 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    +{pendingCompetitors.length - 4} more
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleConfirmSelection}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 font-semibold transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Loading full data...
                  </>
                ) : (
                  "✓ Confirm & Load Full Data"
                )}
              </button>
              <button
                onClick={handleCancelSelection}
                className="px-4 py-3 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                ✕ Cancel
              </button>
            </div>

            <p className="text-xs text-muted-foreground mt-3 text-center">
              💡 Your selection is cached. You can refresh the page and it will
              stay here until you confirm or cancel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Empty State
  if (!hasProducts) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-[1400px] mx-auto">
          <header className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60 rounded-lg transition-colors"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold">
                  {folderSettings.name}
                </h1>
                {folderSettings.category && (
                  <p className="text-sm text-muted-foreground">
                    {folderSettings.category}
                  </p>
                )}
              </div>
            </div>
          </header>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                <Package className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Start Your Competitive Analysis
              </h2>
              <p className="text-muted-foreground mb-8">
                Enter an Amazon ASIN to automatically fetch product details and
                discover similar competitors. We'll analyze ratings, pricing,
                and categories to suggest the best matches.
              </p>

              <AddProductFlow
                folderId={folderId}
                onProductAdded={handleProductAdded}
              />

              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-semibold mb-1">1. Enter ASIN</div>
                    <p className="text-muted-foreground text-xs">
                      Find it in Product Details on Amazon
                    </p>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">2. Review Matches</div>
                    <p className="text-muted-foreground text-xs">
                      AI finds similar competitors
                    </p>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">3. Analyze</div>
                    <p className="text-muted-foreground text-xs">
                      Compare pricing, images & features
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main View with Product & Competitors
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60 rounded-lg transition-colors"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{folderSettings.name}</h1>
            {folderSettings.category && (
              <p className="text-sm text-muted-foreground">
                {folderSettings.category}
              </p>
            )}
          </div>
          <AddProductFlow
            folderId={folderId}
            onProductAdded={handleProductAdded}
          />
        </div>

        <StatsCards myProduct={myProduct} competitors={selectedCompetitors} />

        {/* Complete Product Display */}
        <div className="mt-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4">
              My Product - Full Details
            </h2>
            <CompleteProductView product={myProduct} isMyProduct={true} />
          </div>

          {selectedCompetitors.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">
                Competitors ({selectedCompetitors.length})
              </h2>
              <div className="space-y-6">
                {selectedCompetitors.map((competitor) => (
                  <CompleteProductView
                    key={competitor.id}
                    product={competitor}
                    isMyProduct={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* TEMPORARY: Debug View */}
        <div className="mt-6">
          <details className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
            <summary className="font-bold cursor-pointer">
              🔧 Debug Data (Click to expand)
            </summary>
            <div className="mt-4">
              <DebugDataView myProduct={myProduct} competitors={competitors} />
            </div>
          </details>
        </div>

        <div className="mt-6">
          <TabNavigation
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
          />

          {selectedTab === "overview" && (
            <OverviewTab
              myProduct={myProduct}
              competitors={competitors}
              onToggleCompetitor={toggleCompetitor}
            />
          )}

          {selectedTab === "images" && (
            <ImagesTab
              myProduct={myProduct}
              competitors={competitors}
              onUpdateProduct={setMyProduct}
              onUpdateCompetitor={updateCompetitor}
            />
          )}

          {selectedTab === "pricing" && (
            <PricingTab
              myProduct={myProduct}
              competitors={selectedCompetitors}
            />
          )}

          {selectedTab === "content" && (
            <ContentTab
              myProduct={myProduct}
              competitors={selectedCompetitors}
            />
          )}
        </div>
      </div>
    </div>
  );
}
