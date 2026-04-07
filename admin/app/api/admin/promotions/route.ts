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
        'SELECT * FROM public.promotions WHERE cafe_id = $1 ORDER BY created_at DESC',
        [restaurantId]
    )
    return NextResponse.json({ promotions: res.rows })
}

export async function POST(req: NextRequest) {
    const restaurantId = await getRestaurantId()
    if (!restaurantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const { promo_code, discount_percentage, discount_amount, min_order_amount, max_uses, is_active, valid_until } = body

        const res = await query(
            `INSERT INTO public.promotions (
                cafe_id, promo_code, title_kk, title_ru, 
                discount_percentage, discount_amount, 
                min_order_amount, max_uses, is_active, valid_until
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
            RETURNING *`,
            [
                restaurantId, 
                promo_code.toUpperCase(), 
                `Жеңілдік ${promo_code}`, 
                `Скидка ${promo_code}`, 
                discount_percentage, 
                discount_amount, 
                min_order_amount, 
                max_uses, 
                is_active ?? true, 
                valid_until
            ]
        )
        return NextResponse.json(res.rows[0])
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    const restaurantId = await getRestaurantId()
    if (!restaurantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const { id, promo_code, discount_percentage, discount_amount, min_order_amount, max_uses, is_active, valid_until } = body

        const res = await query(
            `UPDATE public.promotions SET 
                promo_code = $1, 
                title_kk = $2, 
                title_ru = $3,
                discount_percentage = $4, 
                discount_amount = $5, 
                min_order_amount = $6, 
                max_uses = $7, 
                is_active = $8, 
                valid_until = $9,
                updated_at = NOW()
            WHERE id = $10 AND cafe_id = $11
            RETURNING *`,
            [
                promo_code.toUpperCase(), 
                `Жеңілдік ${promo_code}`, 
                `Скидка ${promo_code}`, 
                discount_percentage, 
                discount_amount, 
                min_order_amount, 
                max_uses, 
                is_active, 
                valid_until,
                id,
                restaurantId
            ]
        )
        return NextResponse.json(res.rows[0])
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    const restaurantId = await getRestaurantId()
    if (!restaurantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        await query('DELETE FROM public.promotions WHERE id = $1 AND cafe_id = $2', [id, restaurantId])
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
