'use server'

import { query } from './db/index'
export { query }
import type { Lang } from '@/lib/i18n'

export type UserProfile = {
  id: string
  email: string
  full_name: string
  phone: string
  avatar_url?: string
  fcm_token?: string
  push_subscription?: any
}

export type WorkingHour = {
  id: string
  cafe_id: string
  day_of_week: number
  open_time: string
  close_time: string
  is_day_off: boolean
  created_at?: string
  updated_at?: string
}

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
  base_delivery_fee?: number
  delivery_fee_per_km?: number
  booking_fee?: number
  minimum_order: number
  is_open: boolean
  status: 'open' | 'closed' | 'paused'
  opening_hours: any
  cuisine_types: string[]
  total_seats?: number
  kaspi_link?: string
  latitude?: number
  longitude?: number
  freedom_merchant_id?: string
  freedom_payment_secret_key?: string
  freedom_receipt_secret_key?: string
  freedom_test_mode?: boolean
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

export type ActivityStatus = 
  | 'new' 
  | 'pending' 
  | 'awaiting_payment' 
  | 'accepted' 
  | 'confirmed' 
  | 'preparing' 
  | 'ready' 
  | 'waiting_arrival' 
  | 'on_the_way' 
  | 'on_delivery'
  | 'completed' 
  | 'cancelled' 
  | 'delivered'

export type Order = {
  id: string
  cafe_id: string
  user_id?: string
  customer_name: string
  customer_phone: string
  status: ActivityStatus
  type: 'delivery' | 'pickup' | 'dine_in'
  total_amount: number
  payment_method: 'cash' | 'kaspi' | 'freedom'
  payment_status: 'pending' | 'paid' | 'failed'
  payment_url?: string
  address?: string
  entrance?: string
  floor?: string
  apartment?: string
  comment?: string
  notes?: string
  items_count: number
  order_number: number
  estimated_ready_at?: string
  courier_tracking_token?: string
  delivery_address?: string
  latitude?: number
  longitude?: number
  courier_id?: string
  phone?: string
  created_at: string
  updated_at: string
  order_items?: any[]
}

export type Reservation = {
  id: string
  cafe_id: string
  customer_id?: string
  customer_name: string
  customer_phone: string
  status: ActivityStatus
  date: string
  time: string
  guests_count: number
  total_amount: number
  payment_status: 'pending' | 'paid' | 'failed'
  payment_method?: string
  payment_url?: string
  table_id?: string
  notes?: string
  reservation_items?: any[]
  booking_fee?: number
  created_at: string
  updated_at: string
}

export type RestaurantTable = {
  id: string
  cafe_id: string
  name: string
  table_number?: string | number
  capacity: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Promotion = {
    id: string
    cafe_id: string
    promo_code: string
    title_kk: string
    title_ru: string
    discount_percentage?: number
    discount_amount?: number
    min_order_amount: number
    max_uses?: number
    used_count: number
    is_active: boolean
    valid_until?: string
    created_at: string
    updated_at: string
}

export type Banner = {
    id: string
    cafe_id: string
    title_kk: string
    title_ru: string
    image_url: string
    link_url?: string
    sort_order: number
    is_active: boolean
    created_at: string
    updated_at: string
}

export type Review = {
    id: string
    cafe_id: string
    client_id: string
    order_id?: string
    rating: number
    comment: string
    reply?: string
    replied_at?: string
    is_active: boolean
    created_at: string
    updated_at: string
    customer_name?: string
    customer_avatar?: string
}

export type Courier = {
    id: string
    cafe_id: string
    name: string
    phone: string
    password_hash?: string
    is_active: boolean
    status?: 'active' | 'inactive' | 'busy'
    current_lat?: number
    current_lng?: number
    created_at: string
    updated_at: string
}

export type Category = {
  id: string
  cafe_id: string
  name_kk: string
  name_ru: string
  name_en?: string
  sort_order: number
  is_active: boolean
  is_combo?: boolean
  created_at: string
  updated_at: string
}

export type MenuItem = {
  id: string
  cafe_id: string
  category_id: string | null
  name_kk: string
  name_ru: string
  name_en?: string
  description_kk: string | null
  description_ru: string | null
  description_en?: string | null
  price: number
  original_price: number | null
  image_url: string | null
  is_available: boolean
  is_stop_list: boolean
  sort_order: number
  type: 'food' | 'combo' | 'rental' | 'service'
  rental_deposit?: number
  combo_items?: any[]
  created_at: string
  updated_at: string
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
        const res = await query('SELECT * FROM public.users WHERE id = $1', [userId])
        return res.rows[0] || null
    } catch (error) {
        console.error('[getUserProfile] Error:', error)
        return null
    }
}

export async function getCurrentRestaurantId(userId: string): Promise<string | null> {
    try {
        const res = await query(
            'SELECT id FROM public.restaurants WHERE owner_id = $1 ORDER BY created_at ASC LIMIT 1',
            [userId]
        )
        return res.rows[0]?.id || null
    } catch (error) {
        console.error('[getCurrentRestaurantId] Error:', error)
        return null
    }
}

export async function getCafeSettings(restaurantId: string): Promise<Restaurant | null> {
    try {
        const res = await query('SELECT * FROM public.restaurants WHERE id = $1', [restaurantId])
        return res.rows[0] || null
    } catch (error) {
        console.error('[getCafeSettings] Error:', error)
        return null
    }
}

export async function getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    try {
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
    } catch (error) {
        console.error('[getMenuItems] Error:', error)
        return []
    }
}

export async function getMenuCategories(restaurantId: string): Promise<Category[]> {
    try {
        const res = await query(
            'SELECT * FROM public.categories WHERE cafe_id = $1 ORDER BY sort_order ASC',
            [restaurantId]
        )
        return res.rows || []
    } catch (error) {
        console.error('[getMenuCategories] Error:', error)
        return []
    }
}

export async function getOrders(restaurantId: string, status?: string): Promise<Order[]> {
    try {
        let sql = `
            SELECT o.*, 
                   (SELECT json_agg(items) FROM (
                       SELECT oi.*, 
                              json_build_object('name_kk', mi.name_kk, 'name_ru', mi.name_ru) as menu_items
                       FROM public.order_items oi
                       LEFT JOIN public.menu_items mi ON oi.menu_item_id = mi.id
                       WHERE oi.order_id = o.id
                   ) items) as order_items
            FROM public.orders o 
            WHERE o.cafe_id = $1`
        
        const params = [restaurantId]
        
        if (status && status !== 'all') {
            sql += ' AND o.status = $2'
            params.push(status)
        }
        
        sql += ' ORDER BY o.created_at DESC LIMIT 100'
        
        const res = await query(sql, params)
        return res.rows || []
    } catch (error) {
        console.error('[getOrders] Error:', error)
        return []
    }
}

export async function getReservations(restaurantId: string): Promise<Reservation[]> {
    try {
        const res = await query(
            'SELECT * FROM public.reservations WHERE cafe_id = $1 ORDER BY created_at DESC LIMIT 100',
            [restaurantId]
        )
        return res.rows || []
    } catch (error) {
        console.error('[getReservations] Error:', error)
        return []
    }
}

export async function getOrdersStats(restaurantId: string) {
    try {
        const res = await query(
            `SELECT 
                COUNT(*) as total_orders,
                SUM(total_amount) FILTER (WHERE status = 'delivered' OR status = 'completed') as revenue,
                COUNT(*) FILTER (WHERE status = 'pending' OR status = 'new') as new_orders
             FROM public.orders 
             WHERE cafe_id = $1 AND created_at >= CURRENT_DATE`,
            [restaurantId]
        )
        const stats = res.rows[0]
        return {
            todayRevenue: Number(stats?.revenue || 0),
            todayOrders: Number(stats?.total_orders || 0),
            newOrders: Number(stats?.new_orders || 0)
        }
    } catch (error) {
        console.error('[getOrdersStats] Error:', error)
        return { todayRevenue: 0, todayOrders: 0, newOrders: 0 }
    }
}

export async function getPromotions(restaurantId: string): Promise<Promotion[]> {
    try {
        const res = await query(
            'SELECT * FROM public.promotions WHERE cafe_id = $1 ORDER BY created_at DESC',
            [restaurantId]
        )
        return res.rows || []
    } catch (error) {
        console.error('[getPromotions] Error:', error)
        return []
    }
}

export async function getBanners(restaurantId: string): Promise<Banner[]> {
    try {
        const res = await query(
            'SELECT * FROM public.banners WHERE cafe_id = $1 ORDER BY sort_order ASC, created_at DESC',
            [restaurantId]
        )
        return res.rows || []
    } catch (error) {
        console.error('[getBanners] Error:', error)
        return []
    }
}

export async function getRestaurantTables(restaurantId: string): Promise<RestaurantTable[]> {
    try {
        const res = await query(
            'SELECT * FROM public.restaurant_tables WHERE cafe_id = $1 ORDER BY name ASC',
            [restaurantId]
        )
        return res.rows || []
    } catch (error) {
        console.error('[getRestaurantTables] Error:', error)
        return []
    }
}

export async function getReviews(restaurantId: string): Promise<any[]> {
    try {
        const res = await query(
            `SELECT r.*, u.full_name as customer_name 
             FROM public.reviews r
             LEFT JOIN public.users u ON r.user_id = u.id
             WHERE r.cafe_id = $1 
             ORDER BY r.created_at DESC`,
            [restaurantId]
        )
        return res.rows || []
    } catch (error) {
        console.error('[getReviews] Error:', error)
        return []
    }
}

export async function getRestaurantClients(restaurantId: string): Promise<any[]> {
    try {
        // Aggregating clients from orders since we don't have a separate table yet
        // or we use the 'clients' table if it exists. 
        // Based on existing schema, we have 'clients' table but orders also have customer_name/phone.
        // Let's use orders to get real active customers for this cafe.
        const res = await query(
            `SELECT 
                customer_phone, 
                MAX(customer_name) as customer_name,
                COUNT(*) as total_orders,
                SUM(total_amount) as total_spent,
                MAX(address) as last_address,
                MAX(created_at) as last_order_at
             FROM public.orders
             WHERE cafe_id = $1
             GROUP BY customer_phone
             ORDER BY last_order_at DESC`,
            [restaurantId]
        )
        return res.rows || []
    } catch (error) {
        console.error('[getRestaurantClients] Error:', error)
        return []
    }
}

export async function getCourierByPhone(phone: string): Promise<Courier | null> {
    try {
        const res = await query(
            'SELECT * FROM public.couriers WHERE phone = $1 AND is_active = true LIMIT 1',
            [phone]
        )
        return res.rows[0] || null
    } catch (error) {
        console.error('[getCourierByPhone] Error:', error)
        return null
    }
}

export async function getWorkingHours(restaurantId: string): Promise<any[]> {
    try {
        const res = await query(
            'SELECT * FROM public.working_hours WHERE cafe_id = $1 ORDER BY day_of_week',
            [restaurantId]
        )
        return res.rows || []
    } catch (error) {
        console.error('[getWorkingHours] Error:', error)
        return []
    }
}
