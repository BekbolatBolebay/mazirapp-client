import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const res = await query(
      `SELECT r.*, rest.name_kk as restaurant_name_kk, rest.name_ru as restaurant_name_ru, rest.phone as restaurant_phone
       FROM public.reservations r
       JOIN public.restaurants rest ON r.cafe_id = rest.id
       WHERE r.id = $1`,
      [id]
    )

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Adapt to the expected format in client
    const reservation = {
      ...res.rows[0],
      restaurants: {
        name_kk: res.rows[0].restaurant_name_kk,
        name_ru: res.rows[0].restaurant_name_ru,
        phone: res.rows[0].restaurant_phone
      }
    }

    return NextResponse.json(reservation)
  } catch (error: any) {
    console.error('Reservation GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
