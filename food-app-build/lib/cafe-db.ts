import { query } from '@/lib/db'

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
    freedom_merchant_id?: string
    freedom_payment_secret_key?: string
    freedom_receipt_secret_key?: string
    payment_type?: 'MANUAL' | 'AUTOMATED'
    accept_cash: boolean
    accept_kaspi: boolean
    accept_freedom: boolean
    is_delivery_enabled: boolean
    is_pickup_enabled: boolean
    is_booking_enabled: boolean
    is_new: boolean
    created_at: string
    updated_at: string
}

export type Table = {
    id: string
    cafe_id: string
    table_number: string
    capacity: number
    is_active: boolean
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
    cafe_id: string
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
}

export async function getCurrentRestaurantId(userId: string): Promise<string | null> {
    const res = await query(
        'SELECT id FROM public.restaurants WHERE owner_id = $1 AND status != $2 LIMIT 1',
        [userId, 'deleted']
    )
    return res.rows[0]?.id || null
}
export async function getCafeSettings(restaurantId?: string): Promise<Restaurant | null> {
    if (!restaurantId) return null

    const res = await query(
        'SELECT * FROM public.restaurants WHERE id = $1',
        [restaurantId]
    )
    return res.rows[0] || null
}

export async function getMenuCategories(restaurantId?: string): Promise<Category[]> {
    if (!restaurantId) return []

    const res = await query(
        'SELECT * FROM public.categories WHERE cafe_id = $1 AND is_active = true ORDER BY sort_order ASC',
        [restaurantId]
    )
    return res.rows || []
}

export async function getMenuItems(restaurantId?: string): Promise<MenuItem[]> {
    if (!restaurantId) return []

    const res = await query(
        `SELECT m.*, 
                json_build_object('id', c.id, 'name_kk', c.name_kk, 'name_ru', c.name_ru) as categories
         FROM public.menu_items m
         LEFT JOIN public.categories c ON m.category_id = c.id
         WHERE m.cafe_id = $1
         ORDER BY m.sort_order ASC`,
        [restaurantId]
    )
    return res.rows || []
}

export type WorkingHour = {
    id: string
    cafe_id: string
    day_of_week: number
    open_time: string | null
    close_time: string | null
    is_day_off: boolean
    created_at: string
    updated_at: string
}

export async function getWorkingHours(restaurantId: string): Promise<WorkingHour[]> {
    const res = await query(
        'SELECT * FROM public.working_hours WHERE cafe_id = $1 ORDER BY day_of_week ASC',
        [restaurantId]
    )
    return res.rows || []
}
