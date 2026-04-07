import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const res = await query(
      `SELECT o.*, 
              (SELECT json_build_object('name_en', r.name_en, 'name_ru', r.name_ru, 'phone', r.phone, 'whatsapp_number', r.whatsapp_number) 
               FROM public.restaurants r WHERE r.id = o.cafe_id) as restaurants,
              (SELECT json_agg(json_build_object(
                  'id', oi.id,
                  'quantity', oi.quantity,
                  'price', oi.price,
                  'menu_items', (SELECT json_build_object('name_ru', mi.name_ru, 'name_kk', mi.name_kk, 'name_en', mi.name_en) FROM public.menu_items mi WHERE mi.id = oi.menu_item_id)
                ))
               FROM public.order_items oi WHERE oi.order_id = o.id) as order_items,
              (SELECT json_build_object('rating', rev.rating, 'comment', rev.comment)
               FROM public.reviews rev WHERE rev.order_id = o.id LIMIT 1) as review
       FROM public.orders o
       WHERE o.id = $1`,
      [id]
    )

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(res.rows[0])
  } catch (error: any) {
    console.error('Order GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  try {
    const body = await req.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Allow users to approve quotes or cancel orders
    const allowedStatuses = ['awaiting_payment', 'cancelled']
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Illegal status transition for user' }, { status: 400 })
    }

    const res = await query(
      'UPDATE public.orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    )

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order: res.rows[0] })
  } catch (error: any) {
    console.error('Order PATCH Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
