"use client";

import { Eye } from "lucide-react";
import { Product } from "@/types";

type CompetitorsListProps = {
  competitors: Product[];
  myProduct: Product;
  onToggleCompetitor: (id: string) => void;
};

export function CompetitorsList({
  competitors,
  myProduct,
  onToggleCompetitor,
}: CompetitorsListProps) {
  return (
    <div className="rounded-xl border border-slate-200">
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
          <CompetitorItem
            key={comp.id}
            competitor={comp}
            myProduct={myProduct}
            onToggle={() => onToggleCompetitor(comp.id)}
          />
        ))}
      </div>
    </div>
  );
}

type CompetitorItemProps = {
  competitor: Product;
  myProduct: Product;
  onToggle: () => void;
};

function CompetitorItem({
  competitor,
  myProduct,
  onToggle,
}: CompetitorItemProps) {
  // ✅ Safe price comparison with fallbacks
  const competitorPrice = competitor.price || 0;
  const myProductPrice = myProduct.price || 0;

  const priceDiff =
    myProductPrice > 0
      ? (((competitorPrice - myProductPrice) / myProductPrice) * 100).toFixed(0)
      : "0";
  const isHigher = competitorPrice > myProductPrice;

  return (
    <div
      className={`p-4 hover:bg-slate-50 transition-colors ${
        competitor.selected ? "bg-emerald-50/30" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <input
          type="checkbox"
          checked={!!competitor.selected}
          onChange={onToggle}
          className="w-5 h-5 rounded border-2 cursor-pointer accent-emerald-600"
        />
        {/* ✅ Use mainImageUrl or photos[0] */}
        <img
          src={
            competitor.mainImageUrl ||
            competitor.photos?.[0] ||
            "/placeholder-product.png"
          }
          alt={competitor.name}
          className="w-16 h-16 rounded-lg object-cover border border-slate-200"
          onError={(e) => {
            e.currentTarget.src = "/placeholder-product.png";
          }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm line-clamp-1">
              {competitor.name || competitor.title || "Unnamed Product"}
            </h3>
            {/* ✅ Remove isSponsored as it's not in Product type */}
          </div>
          <p className="text-xs text-slate-500">{competitor.asin}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right min-w-[100px]">
            <p className="text-lg font-bold">${competitorPrice.toFixed(2)}</p>
            {myProductPrice > 0 && (
              <p
                className={`text-xs ${
                  isHigher ? "text-red-600" : "text-green-600"
                }`}
              >
                {isHigher ? "+" : ""}
                {priceDiff}%{isHigher ? " higher" : " lower"}
              </p>
            )}
          </div>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
