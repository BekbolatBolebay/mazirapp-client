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

    const res = await query(
        `SELECT r.*, c.full_name as customer_name 
         FROM public.reviews r
         LEFT JOIN public.clients c ON r.client_id = c.id
         WHERE r.cafe_id = $1 
         ORDER BY r.created_at DESC`,
        [restaurantId]
    )
    return NextResponse.json({ reviews: res.rows })
}

export async function PUT(req: NextRequest) {
    const restaurantId = await getRestaurantId()
    if (!restaurantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const { id, is_active } = body

        const res = await query(
            `UPDATE public.reviews SET 
                is_active = $1,
                updated_at = NOW()
            WHERE id = $2 AND cafe_id = $3
            RETURNING *`,
            [is_active, id, restaurantId]
        )
        return NextResponse.json(res.rows[0])
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
