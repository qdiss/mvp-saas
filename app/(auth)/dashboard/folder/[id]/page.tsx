// app/folders/[id]/page.tsx
// FIXED: Added handleProductDeleted + proper type handling

"use client";

import React, { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Loader2 } from "lucide-react";
import { Product, TabType } from "@/types";
import { StatsCards } from "./components/StatsCards";
import { TabNavigation } from "./components/TabNavigation";
import { OverviewTab } from "./components/tabs/OverviewTab";
import { ImagesTab } from "./components/tabs/ImagesTab";
import { VideoTab } from "./components/tabs/VideoTab";
import { PricingTab } from "./components/tabs/PricingTab";
import { ContentTab } from "./components/tabs/ContentTab";
import { APlusContentTab } from "./components/tabs/APlusContentTab";
import { AddProductFlow } from "./components/AddProductFlow";

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
  });

  const [comparisonId, setComparisonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Load comparison on mount
  useEffect(() => {
    loadExistingComparison();
  }, [folderId]);

  const loadExistingComparison = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/folders/${folderId}/comparison`);

      if (response.ok) {
        const data = await response.json();

        if (data.comparison) {
          const { comparison } = data;

          setComparisonId(comparison.id);

          // Set MY PRODUCT
          if (comparison.primaryProduct) {
            const product = comparison.primaryProduct;

            setMyProduct({
              id: product.asin,
              name: product.title,
              price: parseFloat(product.price || "0"),
              rating: parseFloat(product.rating || "0"),
              reviews: product.ratingsTotal || 0,
              photos: product.images?.map((img: any) => img.imageUrl) || [],
              asin: product.asin,
              brand: product.brand,
              link: product.link,
              selected: true,
              features: product.featureBullets || [],
              specifications: product.specifications || [],
              inStock: product.isInStock,
              isPrime: product.isPrime,
              bestsellerRank: product.bestsellerRank,
              category: product.categoriesFlat,
              comparisonId: comparison.id,
              rawData: product.rawData,
            });
          }

          // Set COMPETITORS
          if (comparison.competitorProducts?.length > 0) {
            setCompetitors(
              comparison.competitorProducts.map((comp: any) => ({
                id: comp.asin,
                name: comp.title,
                price: parseFloat(comp.price || "0"),
                rating: parseFloat(comp.rating || "0"),
                reviews: comp.ratingsTotal || 0,
                photos: comp.images?.map((img: any) => img.imageUrl) || [],
                asin: comp.asin,
                brand: comp.brand,
                link: comp.link,
                selected: true,
                matchScore: comp.matchScore
                  ? parseFloat(comp.matchScore)
                  : null,
                features: comp.featureBullets || [],
                specifications: comp.specifications || [],
                inStock: comp.isInStock,
                isPrime: comp.isPrime,
                bestsellerRank: comp.bestsellerRank,
                category: comp.categoriesFlat,
                addedAt: comp.addedAt,
                position: comp.position,
                comparisonId: comparison.id,
                rawData: comp.rawData,
              }))
            );
          }

          setFolderSettings((prev) => ({
            ...prev,
            name: comparison.name || prev.name,
          }));
        }
      }

      // Load folder details
      const folderResponse = await fetch(`/api/folders/${folderId}`);
      if (folderResponse.ok) {
        const folderData = await folderResponse.json();
        if (folderData.folder) {
          setFolderSettings({
            name: folderData.folder.name,
            category: folderData.folder.category || "",
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

  // ✅ FIXED: Added handleProductDeleted function
  const handleProductDeleted = (productId: string) => {
    console.log("Product deleted:", productId);
    // Remove from competitors list
    setCompetitors((prev) => prev.filter((c) => c.id !== productId));
  };

  const handleProductAdded = async (
    product: any,
    selectedCompetitors: any[]
  ) => {
    console.log("Product added:", product);

    // Update folder name
    await fetch(`/api/folders/${folderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${product.title.substring(0, 40)}... Analysis`,
      }),
    });

    // Reload from database
    await loadExistingComparison();
  };

  const selectedCompetitors = competitors.filter((c) => c.selected);
  const hasProducts = myProduct.name || competitors.length > 0;

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

  // Empty State
  if (!hasProducts) {
    return (
      <div className="min-h-screen min-w-screen p-6">
        <div className="max-w-[1400px] mx-auto">
          <header className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                className="p-2 text-slate-600 hover:bg-white/60 rounded-lg"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold">
                  {folderSettings.name}
                </h1>
              </div>
            </div>
          </header>

          <div className="rounded-xl border border-slate-200 p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Package className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Start Your Competitive Analysis
              </h2>
              <p className="text-muted-foreground mb-8">
                Enter an Amazon ASIN to automatically fetch product details and
                discover similar competitors.
              </p>

              <AddProductFlow
                folderId={folderId}
                onProductAdded={handleProductAdded}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main View
  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            className="p-2 text-slate-600 hover:bg-white/60 rounded-lg"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{folderSettings.name}</h1>
          </div>
          <AddProductFlow
            folderId={folderId}
            onProductAdded={handleProductAdded}
          />
        </div>

        <StatsCards myProduct={myProduct} competitors={selectedCompetitors} />

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
              onProductDeleted={handleProductDeleted}
            />
          )}

          {selectedTab === "images" && (
            <ImagesTab
              myProduct={myProduct}
              competitors={competitors}
              onUpdateProduct={setMyProduct}
              onUpdateCompetitor={updateCompetitor}
              comparisonId={comparisonId || undefined}
            />
          )}

          {selectedTab === "videos" && (
            <VideoTab
              myProduct={myProduct}
              competitors={competitors}
              comparisonId={comparisonId || undefined}
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

          {selectedTab === "aplus" && (
            <APlusContentTab myProduct={myProduct} competitors={competitors} />
          )}
        </div>
      </div>
    </div>
  );
}
