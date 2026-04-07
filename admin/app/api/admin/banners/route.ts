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
        'SELECT * FROM public.banners WHERE cafe_id = $1 ORDER BY sort_order ASC, created_at DESC',
        [restaurantId]
    )
    return NextResponse.json({ banners: res.rows })
}

export async function POST(req: NextRequest) {
    const restaurantId = await getRestaurantId()
    if (!restaurantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const { title_kk, title_ru, image_url, link_url, sort_order, is_active } = body

        const res = await query(
            `INSERT INTO public.banners (
                cafe_id, title_kk, title_ru, image_url, link_url, sort_order, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *`,
            [restaurantId, title_kk, title_ru, image_url, link_url, sort_order || 0, is_active ?? true]
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
        const { id, title_kk, title_ru, image_url, link_url, sort_order, is_active } = body

        const res = await query(
            `UPDATE public.banners SET 
                title_kk = $1, 
                title_ru = $2, 
                image_url = $3, 
                link_url = $4, 
                sort_order = $5, 
                is_active = $6,
                updated_at = NOW()
            WHERE id = $7 AND cafe_id = $8
            RETURNING *`,
            [title_kk, title_ru, image_url, link_url, sort_order, is_active, id, restaurantId]
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
        await query('DELETE FROM public.banners WHERE id = $1 AND cafe_id = $2', [id, restaurantId])
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
