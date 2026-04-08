import { NextRequest, NextResponse } from 'next/server'
import { query, getReservations } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('mazir_auth_token')?.value

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any
        const userId = decoded.userId

        // Get restaurant ID for the user
        const restRes = await query('SELECT id FROM public.restaurants WHERE owner_id = $1', [userId])
        if (restRes.rows.length === 0) {
            return NextResponse.json({ reservations: [] })
        }
        const restaurantId = restRes.rows[0].id

        const reservations = await getReservations(restaurantId)
        return NextResponse.json({ reservations })
    } catch (error: any) {
        console.error('Admin Reservations GET Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
