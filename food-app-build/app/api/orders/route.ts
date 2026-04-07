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
      `SELECT o.*, 
              (SELECT json_build_object('name_en', r.name_en, 'name_ru', r.name_ru, 'name_kk', r.name_kk) 
               FROM public.restaurants r WHERE r.id = o.cafe_id) as restaurants
       FROM public.orders o
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    )

    return NextResponse.json({ orders: res.rows })
  } catch (error: any) {
    console.error('Orders GET Error:', error)
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
      total_amount, 
      delivery_fee, 
      delivery_address, 
      latitude, 
      longitude, 
      payment_method, 
      customer_phone, 
      notes, 
      type, 
      items 
    } = body

    if (!cafe_id || !items || items.length === 0) {
      return NextResponse.json({ error: 'Invalid order data' }, { status: 400 })
    }

    // Generate numeric order number (8 digits)
    const orderNumber = Math.floor(10000000 + Math.random() * 90000000).toString()

    // Insert Order
    const orderRes = await query(
      `INSERT INTO public.orders (
        id, user_id, cafe_id, order_number, status, total_amount, 
        delivery_fee, delivery_address, latitude, longitude, 
        payment_method, payment_status, customer_phone, notes, type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        uuidv4(), userId, cafe_id, orderNumber, 
        payment_method === 'freedom' ? 'awaiting_payment' : 'new',
        total_amount, delivery_fee || 0, delivery_address || '', 
        latitude, longitude, payment_method, 'pending', 
        customer_phone, notes || '', type
      ]
    )

    const order = orderRes.rows[0]

    // Insert Items
    for (const item of items) {
      await query(
        `INSERT INTO public.order_items (id, order_id, menu_item_id, name_ru, name_kk, quantity, price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [uuidv4(), order.id, item.menu_item_id, item.name_ru || '', item.name_kk || '', item.quantity, item.price]
      )
    }

    return NextResponse.json({ success: true, order })
  } catch (error: any) {
    console.error('Order POST Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
