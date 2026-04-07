import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function getCourierContext() {
    const cookieStore = await cookies()
    const token = cookieStore.get('mazir_courier_token')?.value
    if (!token) return null

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        return { 
            id: decoded.courierId, 
            cafeId: decoded.cafeId 
        }
    } catch {
        return null
    }
}

export async function GET() {
    const courier = await getCourierContext()
    if (!courier) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch orders assigned to this courier, or ready for pickup
    const res = await query(
        `SELECT o.*, 
                r.name_kk as cafe_name, r.address as cafe_address,
                (SELECT json_agg(items) FROM (
                    SELECT oi.*, mi.name_kk, mi.name_ru
                    FROM public.order_items oi
                    LEFT JOIN public.menu_items mi ON oi.menu_item_id = mi.id
                    WHERE oi.order_id = o.id
                ) items) as items
         FROM public.orders o
         LEFT JOIN public.restaurants r ON o.cafe_id = r.id
         WHERE o.courier_id = $1 OR (o.status = 'ready' AND o.cafe_id = $2)
         ORDER BY o.created_at DESC`,
        [courier.id, courier.cafeId]
    )
    return NextResponse.json({ orders: res.rows })
}

export async function PUT(req: NextRequest) {
    const courier = await getCourierContext()
    if (!courier) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id, status, current_lat, current_lng } = await req.json()

        if (status) {
            // Update order status
            await query(
                'UPDATE public.orders SET status = $1, courier_id = $2, updated_at = NOW() WHERE id = $3 AND (courier_id = $2 OR courier_id IS NULL)',
                [status, courier.id, id]
            )
        }

        if (current_lat && current_lng) {
            // Update courier location
            await query(
                'UPDATE public.couriers SET current_lat = $1, current_lng = $2, updated_at = NOW() WHERE id = $3',
                [current_lat, current_lng, courier.id]
            )
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
