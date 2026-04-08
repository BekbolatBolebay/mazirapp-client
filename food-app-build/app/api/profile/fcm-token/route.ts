import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('mazir_auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const userId = decoded.userId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { fcmToken } = body // Changed from token to fcmToken to match schema column

    if (!fcmToken) {
      return NextResponse.json({ error: 'FCM Token is required' }, { status: 400 })
    }

    await query(
      'UPDATE public.users SET fcm_token = $1, updated_at = NOW() WHERE id = $2',
      [fcmToken, userId]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('FCM Token Update Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
