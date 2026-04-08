import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(req: NextRequest) {
    const cookieStore = await cookies()
    const token = cookieStore.get('mazir_auth_token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        const userId = decoded.userId
        
        const body = await req.json()
        const { fcm_token } = body

        if (!fcm_token) {
            return NextResponse.json({ error: 'FCM token required' }, { status: 400 })
        }

        await query(
            'UPDATE public.users SET fcm_token = $1, updated_at = NOW() WHERE id = $2',
            [fcm_token, userId]
        )
        
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
