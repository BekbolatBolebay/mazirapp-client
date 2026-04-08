import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('id')

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 })
    }

    const [settingsRes, hoursRes, tablesRes, categoriesRes, itemsRes, reservationsRes] = await Promise.all([
      // 1. Settings
      query('SELECT * FROM public.restaurants WHERE id = $1', [restaurantId]),
      // 2. Working Hours
      query('SELECT * FROM public.working_hours WHERE cafe_id = $1', [restaurantId]),
      // 3. Tables
      query('SELECT * FROM public.restaurant_tables WHERE cafe_id = $1 AND is_active = TRUE', [restaurantId]),
      // 4. Categories
      query('SELECT * FROM public.menu_categories WHERE cafe_id = $1 ORDER BY "order" ASC', [restaurantId]),
      // 5. Menu Items
      query('SELECT * FROM public.menu_items WHERE cafe_id = $1 AND is_available = TRUE', [restaurantId]),
      // 6. Recent Reservations (to check availability)
      query(
        `SELECT id, table_id, date, time, duration_hours, status 
         FROM public.reservations 
         WHERE cafe_id = $1 AND date >= CURRENT_DATE AND status NOT IN ('cancelled', 'rejected')`,
        [restaurantId]
      )
    ])

    if (settingsRes.rows.length === 0) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    return NextResponse.json({
      settings: settingsRes.rows[0],
      workingHours: hoursRes.rows,
      tables: tablesRes.rows,
      categories: categoriesRes.rows,
      menuItems: itemsRes.rows,
      reservations: reservationsRes.rows
    })
  } catch (error: any) {
    console.error('Checkout Settings Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
