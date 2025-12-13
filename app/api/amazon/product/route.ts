//TODO: Insert into Database this amazon product
//TODO: On AddProductFlow make it so it displays competitors similiar to this product
//TODO: Insert all images into the ImagesTab and save everything into the database so I don't waste Usage
//TODO: Make sure to handle errors properly and display them to the user
//TODO: Make sure to cache the results to avoid hitting API limits
//TODO: Add types and interfaces for better type checking

// ============================================
// FILE: app/api/amazon/product/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server'

const RAINFOREST_API_KEY = process.env.RAINFOREST_API_KEY!

interface RainforestProduct {
    product: {
        asin: string
        title: string
        main_image?: {
            link: string
        }
        images?: Array<{
            link: string
        }>
        buybox_winner?: {
            price: {
                value: number
            }
        }
        rating?: number
        ratings_total?: number
        categories?: Array<{
            name: string
        }>
        brand?: string
        feature_bullets?: string[]
        description?: string
    }
}

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
    description?: string
    features?: string[]
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const asin = searchParams.get('asin')

        if (!asin) {
            return NextResponse.json(
                { error: 'ASIN is required' },
                { status: 400 }
            )
        }

        // Validate ASIN format
        const asinPattern = /^B[A-Z0-9]{9}$/i
        if (!asinPattern.test(asin)) {
            return NextResponse.json(
                { error: 'Invalid ASIN format' },
                { status: 400 }
            )
        }

        if (!RAINFOREST_API_KEY) {
            return NextResponse.json(
                { error: 'Rainforest API key not configured' },
                { status: 500 }
            )
        }

        // Call Rainforest API
        const params = new URLSearchParams({
            api_key: RAINFOREST_API_KEY,
            type: 'product',
            amazon_domain: 'amazon.com',
            asin: asin,
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
            const errorText = await response.text()
            console.error('Rainforest API error:', errorText)
            throw new Error(`Rainforest API error: ${response.status} ${response.statusText}`)
        }

        const data: RainforestProduct = await response.json()

        if (!data.product) {
            throw new Error('Product not found')
        }

        // Transform Rainforest data to our format
        const product = data.product
        const productData: AmazonProduct = {
            asin: product.asin,
            name: product.title || 'Unknown Product',
            price: product.buybox_winner?.price?.value || 0,
            rating: product.rating || 0,
            reviews: product.ratings_total || 0,
            image: product.main_image?.link || '',
            images: product.images?.map(img => img.link) || [product.main_image?.link || ''],
            category: product.categories?.[0]?.name || 'Uncategorized',
            brand: product.brand,
            description: product.description,
            features: product.feature_bullets
        }

        return NextResponse.json({
            success: true,
            data: productData
        })

    } catch (error) {
        console.error('Error fetching Amazon product:', error)
        return NextResponse.json(
            { 
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch product data' 
            },
            { status: 500 }
        )
    }
}