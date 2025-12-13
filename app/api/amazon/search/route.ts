//TODO: Add error handling for API requests
//TODO: Add types and interfaces for better type checking
//Find products on Amazon based on a search query I THINK

// ============================================
// FILE: app/api/amazon/search/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server'

const RAINFOREST_API_KEY = process.env.RAINFOREST_API_KEY!

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const query = searchParams.get('q')

        if (!query) {
            return NextResponse.json(
                { error: 'Search query is required' },
                { status: 400 }
            )
        }

        if (!RAINFOREST_API_KEY) {
            return NextResponse.json(
                { error: 'Rainforest API key not configured' },
                { status: 500 }
            )
        }

        const params = new URLSearchParams({
            api_key: RAINFOREST_API_KEY,
            type: 'search',
            amazon_domain: 'amazon.com',
            search_term: query,
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

        const products = data.search_results?.map((result: any) => ({
            asin: result.asin,
            name: result.title || 'Unknown Product',
            price: result.price?.value || 0,
            rating: result.rating || 0,
            reviews: result.ratings_total || 0,
            image: result.image || '',
        })) || []

        return NextResponse.json({
            success: true,
            data: products
        })

    } catch (error) {
        console.error('Error searching products:', error)
        return NextResponse.json(
            { 
                success: false,
                error: error instanceof Error ? error.message : 'Failed to search products' 
            },
            { status: 500 }
        )
    }
}