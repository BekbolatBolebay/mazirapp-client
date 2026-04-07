import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        const { token, action } = await req.json()

        if (!token) {
            return NextResponse.json({ error: 'Token required' }, { status: 400 })
        }

        // Fetch order details by tracking token
        const orderRes = await query(
            `SELECT o.*, 
                    c.name as courier_name, c.phone as courier_phone, c.current_lat as courier_lat, c.current_lng as courier_lng,
                    (SELECT json_agg(items) FROM (
                        SELECT oi.*, mi.name_kk as name, mi.name_ru
                        FROM public.order_items oi
                        LEFT JOIN public.menu_items mi ON oi.menu_item_id = mi.id
                        WHERE oi.order_id = o.id
                    ) items) as items
             FROM public.orders o
             LEFT JOIN public.couriers c ON o.courier_id = c.id
             WHERE o.courier_tracking_token = $1 
             LIMIT 1`,
            [token]
        )

        if (orderRes.rows.length === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        const order = orderRes.rows[0]

        if (action === 'complete') {
            if (['completed', 'delivered', 'cancelled'].includes(order.status)) {
                return NextResponse.json({ error: 'Order already finished' }, { status: 400 })
            }

            await query(
                "UPDATE public.orders SET status = 'delivered', updated_at = NOW() WHERE id = $1",
                [order.id]
            )
            return NextResponse.json({ success: true })
        }

        return NextResponse.json(order)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
