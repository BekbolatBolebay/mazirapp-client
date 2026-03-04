import { createClient } from '@/lib/supabase/server'

export type Restaurant = {
    id: string
    owner_id: string
    name_kk: string
    name_ru: string
    name_en: string
    description_kk: string
    description_ru: string
    description_en: string
    image_url: string
    banner_url: string
    address: string
    phone: string
    rating: number
    delivery_time_min: number
    delivery_time_max: number
    delivery_fee: number
    minimum_order: number
    is_open: boolean
    status: 'open' | 'closed' | 'paused'
    opening_hours: any
    cuisine_types: string[]
    total_seats?: number
    kaspi_link?: string
    accept_cash: boolean
    accept_kaspi: boolean
    accept_freedom: boolean
    is_new: boolean
    created_at: string
    updated_at: string
}

export type Category = {
    id: string
    cafe_id: string
    name_kk: string
    name_ru: string
    name_en: string
    icon_url: string
    sort_order: number
    is_active: boolean
    created_at: string
}

export type MenuItem = {
    id: string
    restaurant_id: string
    cafe_id: string | null
    category_id: string | null
    name_kk: string
    name_ru: string
    name_en: string
    description_kk: string
    description_ru: string
    description_en: string
    image_url: string
    price: number
    original_price: number | null
    is_available: boolean
    is_popular: boolean
    is_stop_list: boolean
    preparation_time: number
    sort_order: number
    created_at: string
    updated_at: string
    categories?: Category
}

export async function getCurrentRestaurantId(): Promise<string | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    return data?.id || null
}

export async function getCafeSettings(): Promise<Restaurant | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .single()
    return data
}

export async function getMenuCategories(): Promise<Category[]> {
    const restaurantId = await getCurrentRestaurantId()
    if (!restaurantId) return []

    const supabase = await createClient()
    const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('cafe_id', restaurantId)
        .order('sort_order', { ascending: true })
    return data || []
}

export async function getMenuItems(): Promise<MenuItem[]> {
    const restaurantId = await getCurrentRestaurantId()
    if (!restaurantId) return []

    const supabase = await createClient()
    const { data } = await supabase
        .from('menu_items')
        .select('*, categories(id, name_kk, name_ru)')
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true })
    return data || []
}
