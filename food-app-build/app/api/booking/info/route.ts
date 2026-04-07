import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const restaurantId = searchParams.get('restaurantId')
  const date = searchParams.get('date')
  const tableId = searchParams.get('tableId')

  if (!restaurantId) {
    return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 })
  }

  try {
    // 1. Fetch restaurant settings
    const restRes = await query(
      'SELECT id, name_kk, name_ru, phone, working_hours, is_booking_enabled, booking_accept_cash, booking_accept_kaspi, booking_accept_freedom, booking_fee, kaspi_link FROM public.restaurants WHERE id = $1',
      [restaurantId]
    )

    // 2. Fetch menu items
    const menuRes = await query(
      'SELECT id, name_kk, name_ru, price, image_url, is_available, category_id FROM public.menu_items WHERE cafe_id = $1 AND is_available = true ORDER BY sort_order ASC',
      [restaurantId]
    )

    // 3. Fetch working hours
    const hoursRes = await query('SELECT * FROM public.working_hours WHERE cafe_id = $1', [restaurantId])

    // 4. Fetch tables
    const tablesRes = await query(
      'SELECT * FROM public.restaurant_tables WHERE cafe_id = $1 AND is_active = true',
      [restaurantId]
    )

    // 5. Fetch busy slots if date/table provided
    let busySlots = []
    if (date && tableId) {
      const busyRes = await query(
        "SELECT time FROM public.reservations WHERE table_id = $1 AND date = $2 AND status != 'cancelled'",
        [tableId, date]
      )
      busySlots = busyRes.rows.map(r => r.time)
    }

    return NextResponse.json({
      restaurant: restRes.rows[0],
      menuItems: menuRes.rows,
      workingHours: hoursRes.rows,
      tables: tablesRes.rows,
      busySlots: busySlots
    })
  } catch (error: any) {
    console.error('Booking Info API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
