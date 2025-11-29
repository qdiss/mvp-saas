export type Product = {
    id: string
    name: string
    asin?: string
    image?: string
    price: number
    rating: number
    reviews: number
    rank?: string
    isSponsored?: boolean
    selected?: boolean
    photos: string[]
    description?: string
    bulletPoints?: string[]
}

export type TabType = 'overview' | 'images' | 'pricing' | 'content'

export type Comment = {
    id: string
    text: string
    imageId: string
}