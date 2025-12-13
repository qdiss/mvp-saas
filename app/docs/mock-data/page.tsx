// app/docs/mock-data/page.tsx
"use client";

import { Copy, Check, Sparkles } from "lucide-react";
import { useState } from "react";

const MOCK_PRODUCTS = [
  {
    asin: "B08X7FN3RX",
    category: "Wireless Earbuds",
    product: "Sony WF-1000XM4",
    price: "$278",
    competitors: 5,
    description:
      "Premium noise-cancelling earbuds with exceptional sound quality",
  },
  {
    asin: "B0CSVZ9DL2",
    category: "Smart Watch",
    product: "Apple Watch Series 9",
    price: "$429",
    competitors: 3,
    description: "Advanced health monitoring with Always-On Retina display",
  },
  {
    asin: "B0CM5JV268",
    category: "Laptop",
    product: "MacBook Pro 14-inch M3",
    price: "$1,599",
    competitors: 3,
    description:
      "Professional laptop with M3 chip and Liquid Retina XDR display",
  },
  {
    asin: "B01N6T5QNO",
    category: "Coffee Maker",
    product: "Breville Barista Express",
    price: "$599.95",
    competitors: 3,
    description: "Professional espresso machine with built-in grinder",
  },
];

export default function MockDataDocsPage() {
  const [copiedAsin, setCopiedAsin] = useState<string | null>(null);

  const copyToClipboard = (asin: string) => {
    navigator.clipboard.writeText(asin);
    setCopiedAsin(asin);
    setTimeout(() => setCopiedAsin(null), 2000);
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-500 rounded-xl">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Mock Data Mode</h1>
              <p className="text-muted-foreground">
                Available ASINs for testing without API tokens
              </p>
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              <strong>Mock mode is currently enabled.</strong> You can test the
              full product comparison flow without consuming Rainforest API
              tokens. Use any of the ASINs below.
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid gap-4">
          {MOCK_PRODUCTS.map((product) => (
            <div
              key={product.asin}
              className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                      {product.category}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {product.competitors} competitors included
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-1">
                    {product.product}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {product.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {product.price}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(product.asin)}
                  className="ml-4 flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  {copiedAsin === product.asin ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {product.asin}
                      </span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-muted-foreground">
                  ASIN:{" "}
                  <code className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded font-mono">
                    {product.asin}
                  </code>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold mb-4">How to Use Mock Data</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">1. Enable Mock Mode</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Set in your{" "}
                <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                  .env.local
                </code>
                :
              </p>
              <pre className="p-3 bg-slate-100 dark:bg-slate-900 rounded text-xs overflow-x-auto">
                NEXT_PUBLIC_USE_MOCK_DATA=true
              </pre>
            </div>

            <div>
              <h3 className="font-medium mb-2">2. Copy an ASIN</h3>
              <p className="text-sm text-muted-foreground">
                Click the copy button next to any product above to copy its
                ASIN.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">3. Test the Flow</h3>
              <p className="text-sm text-muted-foreground">
                Paste the ASIN in the product search input. The system will
                fetch mock data instantly without making any API calls.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">4. Switch to Production</h3>
              <p className="text-sm text-muted-foreground mb-2">
                When ready to use real data, update your environment:
              </p>
              <pre className="p-3 bg-slate-100 dark:bg-slate-900 rounded text-xs overflow-x-auto">
                NEXT_PUBLIC_USE_MOCK_DATA=false
                RAINFOREST_API_KEY=your_actual_api_key
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
