import { query } from './db/index'
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

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
        const res = await query('SELECT * FROM users WHERE id = $1', [userId])
        return res.rows[0] || null
    } catch (error) {
        console.error('[getUserProfile] Error:', error)
        return null
    }
}

export async function getCurrentRestaurantId(userId: string): Promise<string | null> {
    try {
        const res = await query(
            'SELECT id FROM restaurants WHERE owner_id = $1 ORDER BY created_at ASC LIMIT 1',
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
        const res = await query('SELECT * FROM restaurants WHERE id = $1', [restaurantId])
        return res.rows[0] || null
    } catch (error) {
        console.error('[getCafeSettings] Error:', error)
        return null
    }
}

export async function getMenuItems(restaurantId: string): Promise<any[]> {
    try {
        const res = await query(
            `SELECT m.*, 
                    json_build_object('id', c.id, 'name_kk', c.name_kk, 'name_ru', c.name_ru) as categories
             FROM menu_items m
             LEFT JOIN categories c ON m.category_id = c.id
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

export async function getMenuCategories(restaurantId: string): Promise<any[]> {
    try {
        const res = await query(
            'SELECT * FROM categories WHERE cafe_id = $1 ORDER BY sort_order ASC',
            [restaurantId]
        )
        return res.rows || []
    } catch (error) {
        console.error('[getMenuCategories] Error:', error)
        return []
    }
}

export async function getOrders(restaurantId: string, status?: string): Promise<any[]> {
    try {
        let sql = 'SELECT * FROM orders WHERE cafe_id = $1'
        const params = [restaurantId]
        
        if (status && status !== 'all') {
            sql += ' AND status = $2'
            params.push(status)
        }
        
        sql += ' ORDER BY created_at DESC'
        const res = await query(sql, params)
        return res.rows || []
    } catch (error) {
        console.error('[getOrders] Error:', error)
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
             FROM orders 
             WHERE cafe_id = $1 AND created_at >= CURRENT_DATE`,
            [restaurantId]
        )
        const stats = res.rows[0]
        return {
            todayRevenue: Number(stats?.revenue || 0),
            todayOrders: Number(stats?.total_orders || 0),
            new_orders: Number(stats?.new_orders || 0)
        }
    } catch (error) {
        console.error('[getOrdersStats] Error:', error)
        return { todayRevenue: 0, todayOrders: 0, new_orders: 0 }
    }
}
