import { NextRequest } from 'next/server'
import { getPbAdmin } from '@/lib/pocketbase/client'
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
    const adminPb = await getPbAdmin()
    
    let filter = '';
    if (status) filter += `status = "${status}"`;
    if (restaurantId) filter += (filter ? ' && ' : '') + `cafe_id = "${restaurantId}"`;

    const records = await adminPb.collection('orders').getList(1, limit ? parseInt(limit) : 50, {
      filter: filter,
      sort: '-created',
      expand: 'user_id, cafe_id, order_items(order_id)'
    });

    // Transform for frontend
    const orders = records.items.map(order => ({
      ...order,
      users: order.expand?.user_id || {},
      restaurants: order.expand?.cafe_id || {},
      order_items: order.expand?.['order_items(order_id)'] || []
    }));

    return createAdminResponse({ orders })
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

    const adminPb = await getPbAdmin()

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

    const updatedOrder = await adminPb.collection('orders').update(id, updates)

    return createAdminResponse({ order: updatedOrder })
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
    const adminPb = await getPbAdmin()
    const updatedOrder = await adminPb.collection('orders').update(id, {
      status: 'cancelled'
    })

    return createAdminResponse({ order: updatedOrder, message: 'Order cancelled successfully' })
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}
