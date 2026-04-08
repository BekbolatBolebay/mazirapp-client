import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
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

        // NOTE: In the current schema, couriers might be global or restaurant-specific.
        // For now, returning all active couriers available for this cafe.
        const res = await query(
            'SELECT id, full_name, phone, status FROM public.couriers WHERE is_active = true',
            []
        )
        return NextResponse.json({ couriers: res.rows })
    } catch (error: any) {
        console.error('Admin Couriers GET Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
