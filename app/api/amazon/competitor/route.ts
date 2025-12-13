//TODO: Insert into Database this amazon product
//TODO: On AddProductFlow make it so it displays competitors similiar to this product

// ============================================
// FILE: app/api/amazon/competitors/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server'

const RAINFOREST_API_KEY = process.env.RAINFOREST_API_KEY!

interface AmazonProduct {
    asin: string
    name: string
    price: number
    rating: number
    reviews: number
    image: string
    images: string[]
    category: string
    brand?: string
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { category, minRating, minReviews, excludeAsin, searchTerm } = body

        if (!RAINFOREST_API_KEY) {
            return NextResponse.json(
                { error: 'Rainforest API key not configured' },
                { status: 500 }
            )
        }

        // Use search term or category for finding competitors
        const query = searchTerm || category || 'products'

        const params = new URLSearchParams({
            api_key: RAINFOREST_API_KEY,
            type: 'search',
            amazon_domain: 'amazon.com',
            search_term: query,
            sort_by: 'average_review',
            output: 'json'
        })

        const response = await fetch(
            `https://api.rainforestapi.com/request?${params.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )

        if (!response.ok) {
            throw new Error(`Rainforest API error: ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.search_results || data.search_results.length === 0) {
            return NextResponse.json({
                success: true,
                data: []
            })
        }

        // Filter and map results
        const competitors: AmazonProduct[] = data.search_results
            .filter((result: any) => {
                // Exclude the main product
                if (result.asin === excludeAsin) return false
                
                // Filter by minimum rating
                if (minRating && result.rating < minRating) return false
                
                // Filter by minimum reviews
                if (minReviews && result.ratings_total < minReviews) return false
                
                return true
            })
            .slice(0, 6) // Get top 6 competitors
            .map((result: any) => ({
                asin: result.asin,
                name: result.title || 'Unknown Product',
                price: result.price?.value || 0,
                rating: result.rating || 0,
                reviews: result.ratings_total || 0,
                image: result.image || '',
                images: [result.image || ''],
                category: category || 'Uncategorized',
                brand: result.brand
            }))

        return NextResponse.json({
            success: true,
            data: competitors
        })

    } catch (error) {
        console.error('Error fetching competitors:', error)
        return NextResponse.json(
            { 
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch competitors' 
            },
            { status: 500 }
        )
    }
}