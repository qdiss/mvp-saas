// app/folders/[id]/components/tabs/EnhancedContentTab.tsx
// ✅ IMPROVED: Consistent sizing + Read More functionality

"use client";

import { useState } from "react";
import {
  FileText,
  CheckCircle2,
  List,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Product } from "@/types";

type ContentTabProps = {
  myProduct: Product;
  competitors: Product[];
};

// ✅ NEW: ReadMore component for consistent text truncation
function ReadMoreText({
  text,
  maxLength = 200,
}: {
  text: string;
  maxLength?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text || text.length <= maxLength) {
    return <span className="text-sm leading-relaxed">{text}</span>;
  }

  return (
    <div>
      <p className="text-sm leading-relaxed">
        {isExpanded ? text : `${text.substring(0, maxLength)}...`}
      </p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-3 w-3" />
            Show less
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3" />
            Read more
          </>
        )}
      </button>
    </div>
  );
}

// ✅ NEW: Feature item with consistent height
function FeatureItem({ text, index }: { text: string; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 150;
  const needsExpansion = text.length > maxLength;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 min-h-[80px] flex flex-col">
      <div className="flex items-start gap-2 flex-1">
        <div className="w-5 h-5 rounded-full bg-slate-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
          {index}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-700 leading-relaxed">
            {isExpanded || !needsExpansion
              ? text
              : `${text.substring(0, maxLength)}...`}
          </p>
        </div>
      </div>
      {needsExpansion && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 ml-7"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              More
            </>
          )}
        </button>
      )}
    </div>
  );
}

export function ContentTab({ myProduct, competitors }: ContentTabProps) {
  const selectedCompetitors = competitors.filter((c) => c.selected);

  return (
    <div className="rounded-xl border border-slate-200 p-6 space-y-8">
      {/* Product Titles */}
      <TitlesSection myProduct={myProduct} competitors={selectedCompetitors} />

      {/* Features */}
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
        {/* My Product */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-lg p-4 min-h-[140px] flex flex-col">
          <div className="text-xs font-semibold text-emerald-700 mb-2">
            YOUR PRODUCT
          </div>
          <div className="flex-1">
            <ReadMoreText text={myProduct.name} maxLength={150} />
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-2 pt-2 border-t border-emerald-200">
            {myProduct.name?.length || 0} characters
          </div>
        </div>

        {/* Competitors */}
        {competitors.map((comp: any, idx: number) => (
          <div
            key={comp.id}
            className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-h-[140px] flex flex-col"
          >
            <div className="text-xs font-semibold mb-2 text-slate-700">
              COMPETITOR {idx + 1}
            </div>
            <div className="flex-1">
              <ReadMoreText text={comp.name} maxLength={150} />
            </div>
            <div className="text-xs text-slate-500 font-medium mt-2 pt-2 border-t border-slate-200">
              {comp.name?.length || 0} characters
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturesSection({ myProduct, competitors }: any) {
  // Calculate max features to display all products with same height
  const maxFeatures = Math.max(
    myProduct.features?.length || 0,
    ...competitors.map((c: any) => c.features?.length || 0)
  );

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
        {/* My Product */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-emerald-700 mb-3 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-lg p-2">
            YOUR PRODUCT ({myProduct.features?.length || 0} features)
          </div>
          {(myProduct.features || []).map((feature: string, idx: number) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-lg p-3 min-h-[80px] flex flex-col"
            >
              <div className="flex items-start gap-2 flex-1">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <ReadMoreText text={feature} maxLength={150} />
              </div>
            </div>
          ))}
          {(!myProduct.features || myProduct.features.length === 0) && (
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-dashed border-emerald-200 rounded-lg p-4 min-h-[80px] flex items-center justify-center">
              <p className="text-sm text-emerald-600 text-center">
                No features available
              </p>
            </div>
          )}
        </div>

        {/* Competitors */}
        {competitors.map((comp: any, compIdx: number) => (
          <div key={comp.id} className="space-y-2">
            <div className="text-xs font-semibold mb-3 bg-slate-50 border border-slate-200 rounded-lg p-2">
              COMPETITOR {compIdx + 1} ({comp.features?.length || 0} features)
            </div>
            {(comp.features || []).map((feature: string, idx: number) => (
              <FeatureItem key={idx} text={feature} index={idx + 1} />
            ))}
            {(!comp.features || comp.features.length === 0) && (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-4 min-h-[80px] flex items-center justify-center">
                <p className="text-sm text-slate-600 text-center">
                  No features available
                </p>
              </div>
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
        {/* My Product */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-emerald-700 mb-3 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-lg p-2">
            YOUR PRODUCT ({myProduct.specifications?.length || 0} specs)
          </div>
          {(myProduct.specifications || []).map((spec: any, idx: number) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-lg p-3 min-h-[60px]"
            >
              <p className="text-xs text-emerald-700 font-medium mb-1">
                {spec.name}
              </p>
              <ReadMoreText text={spec.value} maxLength={100} />
            </div>
          ))}
          {(!myProduct.specifications ||
            myProduct.specifications.length === 0) && (
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-dashed border-emerald-200 rounded-lg p-4 min-h-[60px] flex items-center justify-center">
              <p className="text-sm text-emerald-600 text-center">
                No specifications available
              </p>
            </div>
          )}
        </div>

        {/* Competitors */}
        {competitors.map((comp: any, compIdx: number) => (
          <div key={comp.id} className="space-y-2">
            <div className="text-xs font-semibold mb-3 bg-slate-50 border border-slate-200 rounded-lg p-2">
              COMPETITOR {compIdx + 1} ({comp.specifications?.length || 0}{" "}
              specs)
            </div>
            {(comp.specifications || []).map((spec: any, idx: number) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-lg p-3 min-h-[60px]"
              >
                <p className="text-xs text-slate-600 font-medium mb-1">
                  {spec.name}
                </p>
                <ReadMoreText text={spec.value} maxLength={100} />
              </div>
            ))}
            {(!comp.specifications || comp.specifications.length === 0) && (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-4 min-h-[60px] flex items-center justify-center">
                <p className="text-sm text-slate-600 text-center">
                  No specifications available
                </p>
              </div>
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
        {/* My Product */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-lg p-4 min-h-[80px]">
          <div className="text-xs font-semibold text-emerald-700 mb-2">
            YOUR PRODUCT
          </div>
          <ReadMoreText
            text={myProduct.category || "No category"}
            maxLength={100}
          />
        </div>

        {/* Competitors */}
        {competitors.map((comp: any, idx: number) => (
          <div
            key={comp.id}
            className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-h-[80px]"
          >
            <div className="text-xs font-semibold mb-2 text-slate-700">
              COMPETITOR {idx + 1}
            </div>
            <ReadMoreText
              text={comp.category || "No category"}
              maxLength={100}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
