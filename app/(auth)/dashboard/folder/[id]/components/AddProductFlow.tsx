// //TODO: Add competitor selection step after fetching main product
// //TODO: Add types and interfaces for better type checking
// //TODO: Add validation and error handling
// //TODO: Improve UI/UX with better styling and feedback
// //TODO: Allow manual product entry if ASIN is not found
// //TODO: Optimize state management for larger flows
// //TODO: Add loading states and spinners during API calls
// //TODO: Ensure accessibility compliance for dialog and form elements

// // components/AddProductFlow.tsx
// "use client"

// import React, { useState } from "react"
// import { Search, Loader2, CheckCircle2, AlertCircle, Plus, Star, X } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle,
// } from "@/components/ui/dialog"
// import { toast } from "sonner"

// interface Product {
//     asin: string
//     name: string
//     price: number
//     rating: number
//     reviews: number
//     image: string
//     images?: string[]
//     category?: string
//     brand?: string
//     description?: string
//     features?: string[]
// }

// interface AddProductFlowProps {
//     folderId: string
//     onProductAdded: (product: Product) => void
// }

// export function AddProductFlow({ folderId, onProductAdded }: AddProductFlowProps) {
//     const [open, setOpen] = useState(false)
//     const [mode, setMode] = useState<'asin' | 'manual'>('asin')
//     const [step, setStep] = useState<'search' | 'competitors' | 'manual'>('search')
//     const [asin, setAsin] = useState('')
//     const [loading, setLoading] = useState(false)
//     const [validating, setValidating] = useState(false)
//     const [fetchingCompetitors, setFetchingCompetitors] = useState(false)
//     const [mainProduct, setMainProduct] = useState<Product | null>(null)
//     const [suggestedCompetitors, setSuggestedCompetitors] = useState<Product[]>([])
//     const [selectedCompetitors, setSelectedCompetitors] = useState<Set<string>>(new Set())

//     // Manual entry state
//     const [manualForm, setManualForm] = useState({
//         name: '',
//         price: '',
//         rating: '',
//         reviews: '',
//         image: '',
//         category: '',
//         brand: ''
//     })

//     // ASIN validation regex
//     const validateASIN = (value: string): boolean => {
//         const asinPattern = /^B[A-Z0-9]{9}$/i
//         return asinPattern.test(value.trim())
//     }

//     const handleASINChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const value = e.target.value.toUpperCase().trim()
//         setAsin(value)
//     }

//     const fetchProductByASIN = async (asinValue: string) => {
//         setLoading(true)
//         setValidating(true)

//         try {
//             const response = await fetch(`/api/amazon/product?asin=${asinValue}`)
//             const result = await response.json()

//             if (!response.ok || !result.success) {
//                 throw new Error(result.error || 'Failed to fetch product')
//             }

//             const productData: Product = result.data

//             setMainProduct(productData)

//             toast.success("Product Found", {
//                 description: `Successfully loaded ${productData.name}`
//             })

//             // Fetch competitor suggestions
//             await fetchCompetitorSuggestions(productData)

//             setStep('competitors')
//         } catch (error) {
//             console.error('Error fetching product:', error)
//             toast.error("Error", {
//                 description: error instanceof Error ? error.message : "Failed to fetch product. Please check the ASIN and try again."
//             })
//         } finally {
//             setLoading(false)
//             setValidating(false)
//         }
//     }

//     const fetchCompetitorSuggestions = async (product: Product) => {
//         setFetchingCompetitors(true)

//         try {
//             const response = await fetch('/api/amazon/competitors', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     category: product.category || product.name.split(' ').slice(0, 2).join(' '),
//                     minRating: Math.max(3.5, product.rating - 1),
//                     minReviews: Math.floor(product.reviews * 0.3),
//                     excludeAsin: product.asin
//                 })
//             })

//             const result = await response.json()

//             if (result.success && result.data) {
//                 setSuggestedCompetitors(result.data)

//                 if (result.data.length === 0) {
//                     toast.info("No Competitors Found", {
//                         description: "We couldn't find similar products. You can add them manually later."
//                     })
//                 }
//             }
//         } catch (error) {
//             console.error('Error fetching competitors:', error)
//             toast.warning("Competitors Unavailable", {
//                 description: "Couldn't fetch competitor suggestions, but you can continue."
//             })
//         } finally {
//             setFetchingCompetitors(false)
//         }
//     }

//     const handleSearch = () => {
//         if (!validateASIN(asin)) {
//             toast.error("Invalid ASIN", {
//                 description: "Please enter a valid Amazon ASIN (e.g., B08N5WRWNW)"
//             })
//             return
//         }

//         fetchProductByASIN(asin)
//     }

//     const toggleCompetitor = (asin: string) => {
//         setSelectedCompetitors(prev => {
//             const newSet = new Set(prev)
//             if (newSet.has(asin)) {
//                 newSet.delete(asin)
//             } else {
//                 newSet.add(asin)
//             }
//             return newSet
//         })
//     }

//     const handleComplete = () => {
//         if (mainProduct) {
//             onProductAdded(mainProduct)

//             // Add selected competitors
//             suggestedCompetitors
//                 .filter(comp => selectedCompetitors.has(comp.asin))
//                 .forEach(comp => onProductAdded(comp))

//             toast.success("Products Added", {
//                 description: `Added ${1 + selectedCompetitors.size} product(s) to analysis`
//             })

//             // Reset and close
//             setOpen(false)
//             resetFlow()
//         }
//     }

//     const handleManualSubmit = () => {
//         if (!manualForm.name || !manualForm.price) {
//             toast.error("Validation Error", {
//                 description: "Please fill in at least the product name and price"
//             })
//             return
//         }

//         const manualProduct: Product = {
//             asin: `MANUAL-${Date.now()}`,
//             name: manualForm.name,
//             price: parseFloat(manualForm.price) || 0,
//             rating: parseFloat(manualForm.rating) || 0,
//             reviews: parseInt(manualForm.reviews) || 0,
//             image: manualForm.image || 'https://via.placeholder.com/400',
//             category: manualForm.category,
//             brand: manualForm.brand
//         }

//         onProductAdded(manualProduct)

//         toast.success("Product Added", {
//             description: "Manual product added successfully"
//         })

//         setOpen(false)
//         resetFlow()
//     }

//     const resetFlow = () => {
//         setAsin('')
//         setMainProduct(null)
//         setSuggestedCompetitors([])
//         setSelectedCompetitors(new Set())
//         setStep('search')
//         setMode('asin')
//         setManualForm({
//             name: '',
//             price: '',
//             rating: '',
//             reviews: '',
//             image: '',
//             category: '',
//             brand: ''
//         })
//     }

//     const handleCancel = () => {
//         setOpen(false)
//         resetFlow()
//     }

//     const openASINMode = () => {
//         setMode('asin')
//         setStep('search')
//         setOpen(true)
//     }

//     const openManualMode = () => {
//         setMode('manual')
//         setStep('manual')
//         setOpen(true)
//     }

//     return (
//         <>
//             <div className="flex gap-2">
//                 <Button onClick={openASINMode} className="gap-2">
//                     <Plus className="h-4 w-4" />
//                     Add by ASIN
//                 </Button>
//                 <Button onClick={openManualMode} variant="outline" className="gap-2">
//                     <Plus className="h-4 w-4" />
//                     Add Manually
//                 </Button>
//             </div>

//             <Dialog open={open} onOpenChange={setOpen}>
//                 <DialogContent className="sm:max-w-[600px]">
//                     {/* ASIN Search Step */}
//                     {step === 'search' && mode === 'asin' && (
//                         <>
//                             <DialogHeader>
//                                 <DialogTitle>Add Product from Amazon</DialogTitle>
//                                 <DialogDescription>
//                                     Enter an Amazon ASIN to fetch product details and start competitive analysis
//                                 </DialogDescription>
//                             </DialogHeader>

//                             <div className="space-y-4 py-4">
//                                 <div className="space-y-2">
//                                     <Label htmlFor="asin">Amazon ASIN</Label>
//                                     <div className="flex gap-2">
//                                         <Input
//                                             id="asin"
//                                             placeholder="e.g., B08N5WRWNW"
//                                             value={asin}
//                                             onChange={handleASINChange}
//                                             onKeyDown={(e) => e.key === 'Enter' && !loading && asin && handleSearch()}
//                                             disabled={loading}
//                                             className="font-mono"
//                                         />
//                                         <Button
//                                             onClick={handleSearch}
//                                             disabled={!asin || loading}
//                                             className="gap-2"
//                                         >
//                                             {loading ? (
//                                                 <Loader2 className="h-4 w-4 animate-spin" />
//                                             ) : (
//                                                 <Search className="h-4 w-4" />
//                                             )}
//                                             Search
//                                         </Button>
//                                     </div>
//                                     <p className="text-xs text-muted-foreground">
//                                         ASIN is a 10-character code starting with 'B' found on Amazon product pages
//                                     </p>
//                                 </div>

//                                 {validating && (
//                                     <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
//                                         <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
//                                         <div className="text-sm">
//                                             <p className="font-medium text-blue-900 dark:text-blue-100">Validating ASIN...</p>
//                                             <p className="text-blue-700 dark:text-blue-300">Fetching product data from Amazon</p>
//                                         </div>
//                                     </div>
//                                 )}
//                             </div>

//                             <DialogFooter>
//                                 <Button variant="outline" onClick={handleCancel}>
//                                     Cancel
//                                 </Button>
//                             </DialogFooter>
//                         </>
//                     )}

//                     {/* Competitors Step */}
//                     {step === 'competitors' && mainProduct && (
//                         <>
//                             <DialogHeader>
//                                 <DialogTitle>Product Added Successfully</DialogTitle>
//                                 <DialogDescription>
//                                     {fetchingCompetitors
//                                         ? "Finding competitors based on category, ratings, and reviews..."
//                                         : suggestedCompetitors.length > 0
//                                             ? "We found some competitors. Select the ones you want to add."
//                                             : "Your product has been added. Click finish to continue."}
//                                 </DialogDescription>
//                             </DialogHeader>

//                             <div className="space-y-4 py-4 max-h-[500px] overflow-y-auto">
//                                 {/* Main Product */}
//                                 <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg border-2 border-emerald-200 dark:border-emerald-800">
//                                     <div className="flex items-center gap-2 mb-2">
//                                         <CheckCircle2 className="h-4 w-4 text-emerald-600" />
//                                         <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
//                                             Your Product
//                                         </span>
//                                     </div>
//                                     <div className="flex gap-3">
//                                         <img
//                                             src={mainProduct.image}
//                                             alt={mainProduct.name}
//                                             className="w-16 h-16 rounded object-cover"
//                                         />
//                                         <div className="flex-1 min-w-0">
//                                             <h4 className="font-medium text-sm line-clamp-2 mb-1">
//                                                 {mainProduct.name}
//                                             </h4>
//                                             <div className="flex items-center gap-3 text-xs text-muted-foreground">
//                                                 <span className="font-semibold text-base text-foreground">
//                                                     ${mainProduct.price.toFixed(2)}
//                                                 </span>
//                                                 {mainProduct.rating > 0 && (
//                                                     <div className="flex items-center gap-1">
//                                                         <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
//                                                         <span>{mainProduct.rating}</span>
//                                                     </div>
//                                                 )}
//                                                 {mainProduct.reviews > 0 && (
//                                                     <span>{mainProduct.reviews.toLocaleString()} reviews</span>
//                                                 )}
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Loading Competitors */}
//                                 {fetchingCompetitors && (
//                                     <div className="flex items-center justify-center p-8">
//                                         <div className="text-center space-y-2">
//                                             <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
//                                             <p className="text-sm text-muted-foreground">
//                                                 Searching for similar products...
//                                             </p>
//                                         </div>
//                                     </div>
//                                 )}

//                                 {/* Suggested Competitors */}
//                                 {!fetchingCompetitors && suggestedCompetitors.length > 0 && (
//                                     <div>
//                                         <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
//                                             <AlertCircle className="h-4 w-4 text-blue-600" />
//                                             Suggested Competitors ({suggestedCompetitors.length})
//                                         </h4>
//                                         <div className="space-y-2">
//                                             {suggestedCompetitors.map((competitor) => (
//                                                 <button
//                                                     key={competitor.asin}
//                                                     onClick={() => toggleCompetitor(competitor.asin)}
//                                                     className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
//                                                         selectedCompetitors.has(competitor.asin)
//                                                             ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
//                                                             : 'border-gray-200 dark:border-gray-800 hover:border-blue-300'
//                                                     }`}
//                                                 >
//                                                     <div className="flex gap-3">
//                                                         <img
//                                                             src={competitor.image}
//                                                             alt={competitor.name}
//                                                             className="w-14 h-14 rounded object-cover"
//                                                         />
//                                                         <div className="flex-1 min-w-0">
//                                                             <h5 className="font-medium text-sm line-clamp-2 mb-1">
//                                                                 {competitor.name}
//                                                             </h5>
//                                                             <div className="flex items-center gap-3 text-xs text-muted-foreground">
//                                                                 <span className="font-semibold text-sm text-foreground">
//                                                                     ${competitor.price.toFixed(2)}
//                                                                 </span>
//                                                                 {competitor.rating > 0 && (
//                                                                     <div className="flex items-center gap-1">
//                                                                         <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
//                                                                         <span>{competitor.rating}</span>
//                                                                     </div>
//                                                                 )}
//                                                                 {competitor.reviews > 0 && (
//                                                                     <span>{competitor.reviews.toLocaleString()}</span>
//                                                                 )}
//                                                             </div>
//                                                         </div>
//                                                         {selectedCompetitors.has(competitor.asin) && (
//                                                             <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
//                                                         )}
//                                                     </div>
//                                                 </button>
//                                             ))}
//                                         </div>
//                                     </div>
//                                 )}
//                             </div>

//                             <DialogFooter className="flex-col sm:flex-row gap-2">
//                                 <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
//                                     Cancel
//                                 </Button>
//                                 <Button
//                                     onClick={handleComplete}
//                                     className="w-full sm:w-auto gap-2"
//                                     disabled={fetchingCompetitors}
//                                 >
//                                     {fetchingCompetitors ? (
//                                         <>
//                                             <Loader2 className="h-4 w-4 animate-spin" />
//                                             Loading...
//                                         </>
//                                     ) : (
//                                         `Add ${1 + selectedCompetitors.size} Product(s)`
//                                     )}
//                                 </Button>
//                             </DialogFooter>
//                         </>
//                     )}

//                     {/* Manual Entry Step */}
//                     {step === 'manual' && mode === 'manual' && (
//                         <>
//                             <DialogHeader>
//                                 <DialogTitle>Add Product Manually</DialogTitle>
//                                 <DialogDescription>
//                                     Enter product details manually for products not on Amazon
//                                 </DialogDescription>
//                             </DialogHeader>

//                             <div className="space-y-4 py-4 max-h-[500px] overflow-y-auto">
//                                 <div className="grid gap-4">
//                                     <div className="grid gap-2">
//                                         <Label htmlFor="manual-name">Product Name *</Label>
//                                         <Input
//                                             id="manual-name"
//                                             placeholder="e.g., Premium Wireless Headphones"
//                                             value={manualForm.name}
//                                             onChange={(e) => setManualForm(prev => ({ ...prev, name: e.target.value }))}
//                                         />
//                                     </div>

//                                     <div className="grid grid-cols-2 gap-4">
//                                         <div className="grid gap-2">
//                                             <Label htmlFor="manual-price">Price ($) *</Label>
//                                             <Input
//                                                 id="manual-price"
//                                                 type="number"
//                                                 step="0.01"
//                                                 placeholder="299.99"
//                                                 value={manualForm.price}
//                                                 onChange={(e) => setManualForm(prev => ({ ...prev, price: e.target.value }))}
//                                             />
//                                         </div>

//                                         <div className="grid gap-2">
//                                             <Label htmlFor="manual-rating">Rating (0-5)</Label>
//                                             <Input
//                                                 id="manual-rating"
//                                                 type="number"
//                                                 step="0.1"
//                                                 min="0"
//                                                 max="5"
//                                                 placeholder="4.5"
//                                                 value={manualForm.rating}
//                                                 onChange={(e) => setManualForm(prev => ({ ...prev, rating: e.target.value }))}
//                                             />
//                                         </div>
//                                     </div>

//                                     <div className="grid gap-2">
//                                         <Label htmlFor="manual-reviews">Number of Reviews</Label>
//                                         <Input
//                                             id="manual-reviews"
//                                             type="number"
//                                             placeholder="1500"
//                                             value={manualForm.reviews}
//                                             onChange={(e) => setManualForm(prev => ({ ...prev, reviews: e.target.value }))}
//                                         />
//                                     </div>

//                                     <div className="grid gap-2">
//                                         <Label htmlFor="manual-image">Image URL</Label>
//                                         <Input
//                                             id="manual-image"
//                                             type="url"
//                                             placeholder="https://example.com/image.jpg"
//                                             value={manualForm.image}
//                                             onChange={(e) => setManualForm(prev => ({ ...prev, image: e.target.value }))}
//                                         />
//                                     </div>

//                                     <div className="grid gap-2">
//                                         <Label htmlFor="manual-category">Category</Label>
//                                         <Input
//                                             id="manual-category"
//                                             placeholder="Electronics"
//                                             value={manualForm.category}
//                                             onChange={(e) => setManualForm(prev => ({ ...prev, category: e.target.value }))}
//                                         />
//                                     </div>

//                                     <div className="grid gap-2">
//                                         <Label htmlFor="manual-brand">Brand</Label>
//                                         <Input
//                                             id="manual-brand"
//                                             placeholder="Sony"
//                                             value={manualForm.brand}
//                                             onChange={(e) => setManualForm(prev => ({ ...prev, brand: e.target.value }))}
//                                         />
//                                     </div>
//                                 </div>
//                             </div>

//                             <DialogFooter>
//                                 <Button variant="outline" onClick={handleCancel}>
//                                     Cancel
//                                 </Button>
//                                 <Button onClick={handleManualSubmit}>
//                                     Add Product
//                                 </Button>
//                             </DialogFooter>
//                         </>
//                     )}
//                 </DialogContent>
//             </Dialog>
//         </>
//     )
// }

// components/AddProductFlow.tsx
"use client";

import React, { useState } from "react";
import { Search, Loader2, Check, X } from "lucide-react";

interface Competitor {
  asin: string;
  title: string;
  price: number;
  currency: string;
  rating: number;
  ratingsTotal: number;
  imageUrl: string;
  score: number;
  selected?: boolean;
}

interface AddProductFlowProps {
  folderId: string;
  onProductAdded: (product: any, competitors: Competitor[]) => void;
}

export function AddProductFlow({
  folderId,
  onProductAdded,
}: AddProductFlowProps) {
  const [asin, setAsin] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "selecting" | "complete">("input");
  const [mainProduct, setMainProduct] = useState<any>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [error, setError] = useState("");

  const handleFetchProduct = async () => {
    if (!asin.trim()) {
      setError("Please enter an ASIN");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/products/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          asin: asin.trim(),
          marketplace: "com",
          folderId,
        }),
      });

      const data = await response.json();

      console.log("Fetch Product Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch product");
      }

      // Set main product
      setMainProduct(data.product);

      // Set competitors with default selection
      setCompetitors(
        data.suggestedCompetitors.map((comp: Competitor, idx: number) => ({
          ...comp,
          selected: idx < 5, // Auto-select top 5
        }))
      );

      setStep("selecting");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch product");
    } finally {
      setLoading(false);
    }
  };

  const toggleCompetitor = (asin: string) => {
    setCompetitors((prev) =>
      prev.map((comp) =>
        comp.asin === asin ? { ...comp, selected: !comp.selected } : comp
      )
    );
  };

  const handleConfirm = () => {
    const selectedCompetitors = competitors.filter((c) => c.selected);
    onProductAdded(mainProduct, selectedCompetitors);
    setStep("complete");

    // Reset after 2 seconds
    setTimeout(() => {
      setAsin("");
      setStep("input");
      setMainProduct(null);
      setCompetitors([]);
    }, 2000);
  };

  const handleCancel = () => {
    setAsin("");
    setStep("input");
    setMainProduct(null);
    setCompetitors([]);
    setError("");
  };

  // Step 1: Input ASIN
  if (step === "input") {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={asin}
            onChange={(e) => setAsin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFetchProduct()}
            placeholder="Enter Amazon ASIN (e.g., B08X7FN3RX)"
            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleFetchProduct}
            disabled={loading || !asin.trim()}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Find Product
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Step 2: Select Competitors
  if (step === "selecting") {
    const selectedCount = competitors.filter((c) => c.selected).length;

    return (
      <div className="space-y-6">
        {/* Main Product */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded">
              YOUR PRODUCT
            </div>
          </div>
          <div className="flex gap-4">
            <img
              src={mainProduct.imageUrl}
              alt={mainProduct.title}
              className="w-20 h-20 object-contain rounded-lg bg-white"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                {mainProduct.title}
              </h3>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  ${mainProduct.price}
                </span>
                <span className="text-yellow-600">★ {mainProduct.rating}</span>
                <span className="text-muted-foreground">
                  {mainProduct.ratingsTotal?.toLocaleString()} reviews
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Competitors Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">
              Select Competitors ({selectedCount} selected)
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setCompetitors((prev) =>
                    prev.map((c) => ({ ...c, selected: true }))
                  )
                }
                className="text-xs text-blue-600 hover:underline"
              >
                Select All
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={() =>
                  setCompetitors((prev) =>
                    prev.map((c) => ({ ...c, selected: false }))
                  )
                }
                className="text-xs text-blue-600 hover:underline"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {competitors.map((comp) => (
              <div
                key={comp.asin}
                onClick={() => toggleCompetitor(comp.asin)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  comp.selected
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      comp.selected
                        ? "bg-green-500 border-green-500"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {comp.selected && <Check className="h-3 w-3 text-white" />}
                  </div>

                  {/* Image */}
                  <img
                    src={comp.imageUrl}
                    alt={comp.title}
                    className="w-12 h-12 object-contain rounded bg-white"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">
                      {comp.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <span className="font-semibold">${comp.price}</span>
                      <span className="text-yellow-600">★ {comp.rating}</span>
                      <span className="text-muted-foreground">
                        {comp.ratingsTotal?.toLocaleString()}
                      </span>
                      <span className="ml-auto px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                        {comp.score.toFixed(0)}% match
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Add {selectedCount} Competitor{selectedCount !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Complete
  return (
    <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-500 text-center">
      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
        <Check className="h-6 w-6 text-white" />
      </div>
      <h3 className="font-semibold text-green-700 dark:text-green-300">
        Products Added Successfully!
      </h3>
      <p className="text-sm text-muted-foreground mt-1">
        Your analysis is ready to begin
      </p>
    </div>
  );
}
