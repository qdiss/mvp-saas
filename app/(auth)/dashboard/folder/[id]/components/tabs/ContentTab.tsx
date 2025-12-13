// app/folders/[id]/components/tabs/EnhancedContentTab.tsx
"use client";

import { FileText, CheckCircle2, List } from "lucide-react";
import { Product } from "@/types";

type ContentTabProps = {
  myProduct: Product;
  competitors: Product[];
};

export function ContentTab({ myProduct, competitors }: ContentTabProps) {
  const selectedCompetitors = competitors.filter((c) => c.selected);

  return (
    <div className="rounded-xl border border-slate-200 p-6 space-y-8">
      {/* Product Titles */}
      <TitlesSection myProduct={myProduct} competitors={selectedCompetitors} />

      {/* Features (Feature Bullets) */}
      <FeaturesSection
        myProduct={myProduct}
        competitors={selectedCompetitors}
      />

      {/* Specifications */}
      <SpecificationsSection
        myProduct={myProduct}
        competitors={selectedCompetitors}
      />

      {/* Categories */}
      <CategoriesSection
        myProduct={myProduct}
        competitors={selectedCompetitors}
      />
    </div>
  );
}

function TitlesSection({ myProduct, competitors }: any) {
  return (
    <div>
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5" />
        Product Titles
      </h3>
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${
            1 + competitors.length
          }, minmax(0, 1fr))`,
        }}
      >
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-emerald-700 mb-2">
            YOUR PRODUCT
          </div>
          <p className="text-sm leading-relaxed mb-2">{myProduct.name}</p>
          <div className="text-xs text-emerald-600 font-medium">
            {myProduct.name?.length || 0} characters
          </div>
        </div>

        {competitors.map((comp: any, idx: number) => (
          <div
            key={comp.id}
            className="bg-slate-50 border border-slate-200 rounded-lg p-4"
          >
            <div className="text-xs font-semibold mb-2">
              COMPETITOR {idx + 1}
            </div>
            <p className="text-sm leading-relaxed mb-2">{comp.name}</p>
            <div className="text-xs text-slate-500 font-medium">
              {comp.name?.length || 0} characters
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturesSection({ myProduct, competitors }: any) {
  return (
    <div>
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5" />
        Key Features / Bullet Points
      </h3>
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${
            1 + competitors.length
          }, minmax(0, 1fr))`,
        }}
      >
        <div className="space-y-2">
          <div className="text-xs font-semibold text-emerald-700 mb-3 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-lg p-2">
            YOUR PRODUCT ({myProduct.features?.length || 0} features)
          </div>
          {(myProduct.features || []).map((feature: string, idx: number) => (
            <div
              key={idx}
              className="flex items-start gap-2 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-lg p-3"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <span className="text-sm text-slate-700 leading-relaxed">
                {feature}
              </span>
            </div>
          ))}
          {(!myProduct.features || myProduct.features.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No features available
            </p>
          )}
        </div>

        {competitors.map((comp: any, compIdx: number) => (
          <div key={comp.id} className="space-y-2">
            <div className="text-xs font-semibold mb-3 bg-slate-50 border border-slate-200 rounded-lg p-2">
              COMPETITOR {compIdx + 1} ({comp.features?.length || 0} features)
            </div>
            {(comp.features || []).map((feature: string, idx: number) => (
              <div
                key={idx}
                className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3"
              >
                <div className="w-5 h-5 rounded-full bg-slate-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <span className="text-sm text-slate-700 leading-relaxed">
                  {feature}
                </span>
              </div>
            ))}
            {(!comp.features || comp.features.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No features available
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SpecificationsSection({ myProduct, competitors }: any) {
  return (
    <div>
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <List className="h-5 w-5" />
        Product Specifications
      </h3>
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${
            1 + competitors.length
          }, minmax(0, 1fr))`,
        }}
      >
        <div className="space-y-2">
          <div className="text-xs font-semibold text-emerald-700 mb-3 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-lg p-2">
            YOUR PRODUCT ({myProduct.specifications?.length || 0} specs)
          </div>
          {(myProduct.specifications || []).map((spec: any, idx: number) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-lg p-3"
            >
              <p className="text-xs text-emerald-700 font-medium mb-1">
                {spec.name}
              </p>
              <p className="text-sm text-slate-700">{spec.value}</p>
            </div>
          ))}
          {(!myProduct.specifications ||
            myProduct.specifications.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No specifications available
            </p>
          )}
        </div>

        {competitors.map((comp: any, compIdx: number) => (
          <div key={comp.id} className="space-y-2">
            <div className="text-xs font-semibold mb-3 bg-slate-50 border border-slate-200 rounded-lg p-2">
              COMPETITOR {compIdx + 1} ({comp.specifications?.length || 0}{" "}
              specs)
            </div>
            {(comp.specifications || []).map((spec: any, idx: number) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-lg p-3"
              >
                <p className="text-xs text-slate-600 font-medium mb-1">
                  {spec.name}
                </p>
                <p className="text-sm text-slate-700">{spec.value}</p>
              </div>
            ))}
            {(!comp.specifications || comp.specifications.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No specifications available
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoriesSection({ myProduct, competitors }: any) {
  if (!myProduct.category && !competitors.some((c: any) => c.category)) {
    return null;
  }

  return (
    <div>
      <h3 className="font-semibold mb-4">Product Categories</h3>
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${
            1 + competitors.length
          }, minmax(0, 1fr))`,
        }}
      >
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-emerald-700 mb-2">
            YOUR PRODUCT
          </div>
          <p className="text-sm text-slate-700">
            {myProduct.category || "No category"}
          </p>
        </div>

        {competitors.map((comp: any, idx: number) => (
          <div
            key={comp.id}
            className="bg-slate-50 border border-slate-200 rounded-lg p-4"
          >
            <div className="text-xs font-semibold mb-2">
              COMPETITOR {idx + 1}
            </div>
            <p className="text-sm text-slate-700">
              {comp.category || "No category"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
