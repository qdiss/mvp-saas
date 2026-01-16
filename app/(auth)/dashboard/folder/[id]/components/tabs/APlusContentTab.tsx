// app/folders/[id]/components/tabs/APlusContentTab.tsx
// ✅ 100% IDENTICAL to Amazon A+ Content Layout

"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Info,
  AlertCircle,
} from "lucide-react";
import { Product } from "@/types";

type APlusContentTabProps = {
  myProduct: Product;
  competitors: Product[];
};

// ✅ Amazon-style Image Carousel
function ImageCarousel({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Single image - no carousel needed
  if (images.length === 1) {
    return (
      <div className="w-full bg-white rounded-lg overflow-hidden border border-slate-200">
        <img
          src={images[0]}
          alt="Product content"
          className="w-full object-contain"
          style={{ maxHeight: "600px" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Image Display */}
      <div className="relative bg-white rounded-lg overflow-hidden border border-slate-200 group">
        <div
          className="w-full flex items-center justify-center"
          style={{ minHeight: "400px", maxHeight: "600px" }}
        >
          <img
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/95 hover:bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-6 w-6 text-slate-700" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/95 hover:bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
          aria-label="Next image"
        >
          <ChevronRight className="h-6 w-6 text-slate-700" />
        </button>

        {/* Image Counter */}
        <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/75 text-white text-sm rounded-md font-medium">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail Strip */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition-all ${
              index === currentIndex
                ? "border-orange-500 ring-2 ring-orange-200"
                : "border-slate-200 hover:border-slate-400"
            }`}
          >
            <img
              src={image}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// ✅ Amazon-style A+ Content Module Display
function APlusModule({
  moduleData,
  moduleType,
}: {
  moduleData: any;
  moduleType: string;
}) {
  // Handle different module types
  if (!moduleData) return null;

  // Images array (most common)
  if (
    Array.isArray(moduleData) &&
    moduleData.length > 0 &&
    typeof moduleData[0] === "string"
  ) {
    return (
      <div className="w-full">
        <ImageCarousel images={moduleData} />
      </div>
    );
  }

  // Brand story module
  if (moduleType === "brand_story" && typeof moduleData === "object") {
    const { hero_image, brand_logo, body, images } = moduleData;

    return (
      <div className="space-y-6">
        {/* Hero image or carousel */}
        {images && images.length > 0 ? (
          <ImageCarousel images={images} />
        ) : hero_image ? (
          <div className="w-full bg-white rounded-lg overflow-hidden border border-slate-200">
            <img
              src={hero_image}
              alt="Brand story"
              className="w-full object-contain"
            />
          </div>
        ) : null}

        {/* Brand logo */}
        {brand_logo && (
          <div className="flex justify-center py-6 bg-slate-50 rounded-lg">
            <img
              src={brand_logo}
              alt="Brand logo"
              className="h-20 object-contain"
            />
          </div>
        )}

        {/* Story text */}
        {body && (
          <div className="prose max-w-none">
            <p className="text-base leading-relaxed text-slate-700 whitespace-pre-wrap">
              {body}
            </p>
          </div>
        )}
      </div>
    );
  }

  // FAQs module
  if (moduleType === "faqs" && Array.isArray(moduleData)) {
    return (
      <div className="space-y-4">
        {moduleData.map((faq: any, idx: number) => (
          <div
            key={idx}
            className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/50 rounded-r"
          >
            <p className="font-semibold text-slate-900 mb-2">Q: {faq.title}</p>
            <p className="text-slate-700">A: {faq.body}</p>
          </div>
        ))}
      </div>
    );
  }

  // Text content
  if (typeof moduleData === "string" && moduleData.length > 0) {
    return (
      <div className="prose max-w-none">
        <p className="text-base leading-relaxed text-slate-700 whitespace-pre-wrap">
          {moduleData}
        </p>
      </div>
    );
  }

  // Object with nested data
  if (typeof moduleData === "object" && !Array.isArray(moduleData)) {
    // Check if it has displayable content
    const entries = Object.entries(moduleData).filter(
      ([key, value]) =>
        value &&
        key !== "has_a_plus_content" &&
        key !== "third_party" &&
        typeof value !== "boolean"
    );

    if (entries.length === 0) return null;

    return (
      <div className="space-y-4">
        {entries.map(([key, value]) => (
          <div key={key} className="space-y-2">
            <h4 className="font-semibold text-slate-900 capitalize">
              {key.replace(/_/g, " ")}
            </h4>
            {typeof value === "string" ? (
              <p className="text-slate-700">{value}</p>
            ) : Array.isArray(value) &&
              value.length > 0 &&
              typeof value[0] === "string" ? (
              value[0].startsWith("http") ? (
                <ImageCarousel images={value as string[]} />
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  {value.map((item, idx) => (
                    <li key={idx} className="text-slate-700">
                      {String(item)}
                    </li>
                  ))}
                </ul>
              )
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// ✅ Main A+ Content Card (Amazon-style)
function APlusContentCard({
  product,
  isMyProduct,
}: {
  product: Product;
  isMyProduct: boolean;
}) {
  const borderColor = isMyProduct ? "border-orange-300" : "border-slate-200";
  const headerBg = isMyProduct
    ? "bg-gradient-to-r from-orange-400 to-orange-500"
    : "bg-gradient-to-r from-slate-600 to-slate-700";

  // @ts-ignore - Access rawData
  const aplusContent = product?.rawData?.a_plus_content;

  // Debug: Check if we have A+ content
  console.log(
    `[A+ Content] ${product.name}:`,
    aplusContent ? "Has data" : "No data"
  );

  if (!aplusContent) {
    return (
      <div
        className={`rounded-lg border-2 ${borderColor} bg-white overflow-hidden`}
      >
        {/* Header */}
        <div className={`${headerBg} px-4 py-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-white" />
              <h3 className="text-sm font-semibold text-white">
                {isMyProduct ? "Your Product" : product.name}
              </h3>
            </div>
            <a
              href={`https://www.amazon.com/dp/${product.asin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/90 hover:text-white flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              View on Amazon
            </a>
          </div>
        </div>

        {/* Empty State */}
        <div className="p-12 text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-slate-300" />
          <p className="font-semibold text-slate-600 mb-1">No Brand Story</p>
          <p className="text-sm text-slate-500">
            This product doesn't have enhanced Brand Story
          </p>
        </div>
      </div>
    );
  }

  // Extract modules from A+ content
  const modules = [];

  // Add brand story if exists
  if (aplusContent.brand_story) {
    modules.push({
      type: "brand_story",
      data: aplusContent.brand_story,
      title: "Brand Story",
    });
  }

  // Add images if exist
  if (aplusContent.images && aplusContent.images.length > 0) {
    modules.push({
      type: "images",
      data: aplusContent.images,
      title: "Product Images",
    });
  }

  // Add hero image if no images array
  if (!aplusContent.images && aplusContent.hero_image) {
    modules.push({
      type: "images",
      data: [aplusContent.hero_image],
      title: "Hero Image",
    });
  }

  // Add title and description
  if (aplusContent.title || aplusContent.description) {
    modules.push({
      type: "text",
      data: {
        title: aplusContent.title,
        description: aplusContent.description,
      },
      title: "Product Description",
    });
  }

  // Add FAQs
  if (aplusContent.faqs && aplusContent.faqs.length > 0) {
    modules.push({ type: "faqs", data: aplusContent.faqs, title: "FAQs" });
  }

  // Add company info
  if (aplusContent.company_logo || aplusContent.company_description_text) {
    modules.push({
      type: "company",
      data: {
        logo: aplusContent.company_logo,
        description: aplusContent.company_description_text,
      },
      title: "Company Info",
    });
  }

  // Add any other modules (generic handling)
  Object.entries(aplusContent).forEach(([key, value]) => {
    if (
      value &&
      ![
        "brand_story",
        "images",
        "hero_image",
        "title",
        "description",
        "faqs",
        "company_logo",
        "company_description_text",
        "has_a_plus_content",
        "third_party",
      ].includes(key)
    ) {
      modules.push({
        type: key,
        data: value,
        title: key.replace(/_/g, " ").toUpperCase(),
      });
    }
  });

  return (
    <div
      className={`rounded-lg border-2 ${borderColor} bg-white overflow-hidden`}
    >
      {/* Header */}
      <div className={`${headerBg} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-white" />
            <h3 className="text-sm font-semibold text-white">
              {isMyProduct ? "Your Product" : product.name}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/80 font-medium">
              {modules.length} {modules.length === 1 ? "module" : "modules"}
            </span>
            <a
              href={`https://www.amazon.com/dp/${product.asin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/90 hover:text-white flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Amazon
            </a>
          </div>
        </div>
      </div>

      {/* Content Modules (Amazon-style vertical stack) */}
      <div className="divide-y divide-slate-200">
        {modules.map((module, idx) => (
          <div key={idx} className="p-6">
            {/* Module Title */}
            {module.title && (
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-orange-500" />
                {module.title}
              </h4>
            )}

            {/* Module Content */}
            {module.type === "text" && typeof module.data === "object" ? (
              <div className="space-y-3">
                {module.data.title && (
                  <h3 className="text-xl font-bold text-slate-900">
                    {module.data.title}
                  </h3>
                )}
                {module.data.description && (
                  <p className="text-base leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {module.data.description}
                  </p>
                )}
              </div>
            ) : module.type === "company" && typeof module.data === "object" ? (
              <div className="space-y-4">
                {module.data.logo && (
                  <div className="flex justify-center py-4 bg-slate-50 rounded-lg">
                    <img
                      src={module.data.logo}
                      alt="Company logo"
                      className="h-16 object-contain"
                    />
                  </div>
                )}
                {module.data.description && (
                  <p className="text-base leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {module.data.description}
                  </p>
                )}
              </div>
            ) : (
              <APlusModule moduleData={module.data} moduleType={module.type} />
            )}
          </div>
        ))}

        {/* If no modules, show message */}
        {modules.length === 0 && (
          <div className="p-12 text-center">
            <Info className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-500">
              Brand story data is available but contains no displayable modules
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ✅ Main Tab Component
export function APlusContentTab({
  myProduct,
  competitors,
}: APlusContentTabProps) {
  const selectedCompetitors = competitors.filter((c) => c.selected);
  const totalProducts = 1 + selectedCompetitors.length;

  return (
    <div className="space-y-6">
      {/* Products Grid */}
      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns:
            totalProducts === 1
              ? "1fr"
              : totalProducts === 2
              ? "repeat(2, minmax(0, 1fr))"
              : "repeat(auto-fit, minmax(450px, 1fr))",
        }}
      >
        {/* My Product */}
        <APlusContentCard product={myProduct} isMyProduct={true} />

        {/* Selected Competitors */}
        {selectedCompetitors.map((comp) => (
          <APlusContentCard key={comp.id} product={comp} isMyProduct={false} />
        ))}
      </div>
    </div>
  );
}
