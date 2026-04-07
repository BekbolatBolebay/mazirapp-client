import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { verifyAdmin, createAdminResponse, createAdminError } from '@/lib/auth/admin'

// GET all orders
export async function GET(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const restaurantId = searchParams.get('cafe_id')
  const limit = searchParams.get('limit')

  try {
    const sql = `
      SELECT o.*, 
             (SELECT json_build_object('full_name', u.full_name, 'phone', u.phone) 
              FROM public.users u WHERE u.id = o.user_id) as users,
             (SELECT json_build_object('name_en', r.name_en, 'name_ru', r.name_ru, 'phone', r.phone) 
              FROM public.restaurants r WHERE r.id = o.cafe_id) as restaurants,
             (SELECT json_agg(json_build_object(
                'id', oi.id,
                'quantity', oi.quantity,
                'price', oi.price,
                'menu_items', (SELECT json_build_object('name_en', mi.name_en, 'name_ru', mi.name_ru, 'image_url', mi.image_url) 
                               FROM public.menu_items mi WHERE mi.id = oi.menu_item_id)
              )) FROM public.order_items oi WHERE oi.order_id = o.id) as order_items
      FROM public.orders o
      WHERE ($1::text IS NULL OR o.status = $1)
        AND ($2::uuid IS NULL OR o.cafe_id = $2)
      ORDER BY o.created_at DESC
      LIMIT $3
    `;
    
    const res = await query(sql, [status || null, restaurantId || null, limit ? parseInt(limit) : 50])
    return createAdminResponse({ orders: res.rows })
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}

// PUT update order status
export async function PUT(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  try {
    const body = await req.json()
    const { id, status, estimated_delivery_time } = body

    if (!id || !status) {
      return createAdminError('Order ID and status are required', 400)
    }

    const validStatuses = ['pending', 'preparing', 'on_the_way', 'delivered', 'cancelled', 'paid', 'accepted']
    if (!validStatuses.includes(status)) {
      return createAdminError('Invalid status', 400)
    }

    const updates: any = { status }

    if (status === 'preparing') {
      updates.preparing_at = new Date().toISOString()
    } else if (status === 'on_the_way') {
      updates.out_for_delivery_at = new Date().toISOString()
    } else if (status === 'delivered') {
      updates.delivered_at = new Date().toISOString()
    }

    if (estimated_delivery_time) {
      updates.estimated_delivery_time = estimated_delivery_time
    }

    const keys = Object.keys(updates);
    const values = keys.map(k => updates[k]);
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');

    const res = await query(
      `UPDATE public.orders SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    )

    if (res.rowCount === 0) {
      return createAdminError('Order not found', 404)
    }

    return createAdminResponse({ order: res.rows[0] })
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}

// DELETE cancel order
export async function DELETE(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return createAdminError('Order ID is required', 400)
  }

  try {
    const res = await query(
      "UPDATE public.orders SET status = 'cancelled' WHERE id = $1 RETURNING *",
      [id]
    )

    if (res.rowCount === 0) {
      return createAdminError('Order not found', 404)
    }

    return createAdminResponse({ order: res.rows[0], message: 'Order cancelled successfully' })
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}
