import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function getRestaurantId() {
    const cookieStore = await cookies()
    const token = cookieStore.get('mazir_auth_token')?.value
    if (!token) return null

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        const userId = decoded.userId
        const restRes = await query('SELECT id FROM public.restaurants WHERE owner_id = $1', [userId])
        return restRes.rows.length > 0 ? restRes.rows[0].id : null
    } catch {
        return null
    }
}

export async function GET() {
    const restaurantId = await getRestaurantId()
    if (!restaurantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Aggregate unique clients from orders
    const res = await query(
        `SELECT 
            customer_phone, 
            MAX(customer_name) as customer_name,
            COUNT(*) as total_orders,
            SUM(total_amount) as total_spent,
            MAX(address) as last_address,
            MAX(created_at) as last_order_at
         FROM public.orders
         WHERE cafe_id = $1
         GROUP BY customer_phone
         ORDER BY last_order_at DESC`,
        [restaurantId]
    )
    return NextResponse.json({ clients: res.rows })
}

export async function DELETE(req: NextRequest) {
    const restaurantId = await getRestaurantId()
    if (!restaurantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { searchParams } = new URL(req.url)
        const phone = searchParams.get('phone')
        if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 })

        // Deleting all orders from this phone for this restaurant
        // This is a way to "delete" the client from this cafe context
        await query(
            'DELETE FROM public.orders WHERE cafe_id = $1 AND customer_phone = $2',
            [restaurantId, phone]
        )
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
