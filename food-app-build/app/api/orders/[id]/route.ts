import { NextRequest, NextResponse } from 'next/server'
import { getPbAdmin } from '@/lib/pocketbase/client'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const adminPb = await getPbAdmin()
    
    // Fetch order with related items and restaurant info using expand
    const order = await adminPb.collection('orders').getOne(id, {
      expand: 'cafe_id, order_items(order_id)'
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Transform for frontend compatibility
    return NextResponse.json({
      ...order,
      restaurants: order.expand?.cafe_id || {},
      order_items: order.expand?.['order_items(order_id)'] || []
    })
  } catch (error: any) {
    console.error('Order GET Error:', error)
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
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

    const adminPb = await getPbAdmin()

    // Update status in PocketBase
    const updatedOrder = await adminPb.collection('orders').update(id, {
      status: status
    })

    return NextResponse.json({ order: updatedOrder })
  } catch (error: any) {
    console.error('Order PATCH Error:', error)
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}
