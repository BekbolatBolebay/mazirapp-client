import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

const JWT_SECRET = process.env.JWT_SECRET || 'mazir_super_secret_jwt_key_2026'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('mazir_auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const userId = decoded.userId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const res = await query(
      `SELECT res.*, 
              (SELECT json_build_object('name_en', r.name_en, 'name_ru', r.name_ru, 'name_kk', r.name_kk) 
               FROM public.restaurants r WHERE r.id = res.cafe_id) as restaurants
       FROM public.reservations res
       WHERE res.user_id = $1
       ORDER BY res.created_at DESC`,
      [userId]
    )

    return NextResponse.json({ reservations: res.rows })
  } catch (error: any) {
    console.error('Reservations GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('mazir_auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const userId = decoded.userId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { 
      cafe_id, 
      customer_name, 
      customer_phone, 
      date, 
      time, 
      guests_count, 
      table_id, 
      payment_method, 
      notes, 
      duration_hours, 
      total_amount, 
      booking_fee,
      items 
    } = body

    if (!cafe_id || !table_id || !date || !time) {
      return NextResponse.json({ error: 'Invalid reservation data' }, { status: 400 })
    }

    // Insert Reservation
    const reservationRes = await query(
      `INSERT INTO public.reservations (
        id, user_id, cafe_id, table_id, customer_name, customer_phone, 
        date, time, guests_count, status, payment_method, payment_status, 
        notes, duration_hours, total_amount, booking_fee
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        uuidv4(), userId, cafe_id, table_id, customer_name, customer_phone, 
        date, time, guests_count, 
        payment_method === 'freedom' ? 'awaiting_payment' : 'pending',
        payment_method, 'pending', notes || '', duration_hours, 
        total_amount, booking_fee || 0
      ]
    )

    const reservation = reservationRes.rows[0]

    // Insert Items (Pre-orders) if any
    if (items && items.length > 0) {
      for (const item of items) {
        await query(
          `INSERT INTO reservation_items (id, reservation_id, menu_item_id, quantity, price)
           VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), reservation.id, item.menu_item_id, item.quantity, item.price]
        )
      }
    }

    return NextResponse.json({ success: true, reservation })
  } catch (error: any) {
    console.error('Reservation POST Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
