import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('mazir_auth_token')?.value

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any
        const userId = decoded.id || decoded.userId // Fallback for transition

        const res = await query(`
            SELECT u.*, 
                   json_build_object('id', r.id, 'name_kk', r.name_kk, 'name_ru', r.name_ru) as restaurant
            FROM public.users u
            LEFT JOIN public.restaurants r ON r.owner_id = u.id
            WHERE u.id = $1
        `, [userId])

        if (res.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({ profile: res.rows[0] })
    } catch (error: any) {
        console.error('Profile GET Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('mazir_auth_token')?.value

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any
        const userId = decoded.id || decoded.userId

        const body = await request.json()
        const { full_name, phone, push_subscription } = body

        let res;
        if (push_subscription !== undefined) {
            res = await query(
                'UPDATE public.users SET push_subscription = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
                [push_subscription, userId]
            )
        } else {
            if (!full_name || !phone) {
                return NextResponse.json({ error: 'Full name and phone are required' }, { status: 400 })
            }
            res = await query(
                'UPDATE public.users SET name = $1, phone = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
                [full_name, phone, userId]
            )
        }

        if (res.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, profile: res.rows[0] })
    } catch (error: any) {
        console.error('Profile PUT Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
