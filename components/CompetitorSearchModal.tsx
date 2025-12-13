// ============================================
// REACT COMPONENT: Competitor Search Modal
// components/CompetitorSearchModal.tsx
// ============================================

"use client";

import { useState } from "react";
import { Search, Filter, Plus } from "lucide-react";

interface SearchFilters {
  minRating?: number;
  maxPrice?: number;
  minPrice?: number;
  category?: string;
}

export function CompetitorSearchModal({
  comparisonId,
  onAddCompetitor,
}: {
  comparisonId: string;
  onAddCompetitor: (asin: string) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [marketplace, setMarketplace] = useState("com");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/search/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, marketplace, filters }),
      });

      const data = await response.json();
      setResults(data.data.products || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Search Bar */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search for competitors..."
          className="flex-1 px-4 py-2 border rounded-lg"
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />

        {/* Marketplace Selector */}
        <select
          value={marketplace}
          onChange={(e) => setMarketplace(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="com">.com</option>
          <option value="co.uk">.co.uk</option>
          <option value="de">.de</option>
          <option value="fr">.fr</option>
          <option value="ca">.ca</option>
        </select>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          <Filter className="h-5 w-5" />
        </button>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Searching..." : <Search className="h-5 w-5" />}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="text-sm text-gray-600">Min Rating</label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={filters.minRating || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  minRating: parseFloat(e.target.value),
                })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Min Price</label>
            <input
              type="number"
              value={filters.minPrice || ""}
              onChange={(e) =>
                setFilters({ ...filters, minPrice: parseFloat(e.target.value) })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Max Price</label>
            <input
              type="number"
              value={filters.maxPrice || ""}
              onChange={(e) =>
                setFilters({ ...filters, maxPrice: parseFloat(e.target.value) })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Category</label>
            <input
              type="text"
              value={filters.category || ""}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>
      )}

      {/* Results */}
      <div className="space-y-2">
        {results.map((product) => (
          <div
            key={product.asin}
            className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
          >
            <img
              src={product.image}
              alt={product.title}
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1">
              <h3 className="font-medium">{product.title}</h3>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                <span>★ {product.rating}</span>
                <span>{product.ratings_total} reviews</span>
                <span className="font-semibold text-gray-900">
                  {product.price?.raw}
                </span>
              </div>
            </div>
            <button
              onClick={() => onAddCompetitor(product.asin)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
