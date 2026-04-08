import { NextRequest, NextResponse } from 'next/server'
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
    const userId = decoded.userId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [ordersCountRes, favoritesCountRes, activeOrderRes] = await Promise.all([
      query('SELECT COUNT(*) FROM public.orders WHERE user_id = $1', [userId]),
      query('SELECT COUNT(*) FROM favorites WHERE user_id = $1', [userId]),
      query(
        `SELECT id, status, total_amount, order_number, created_at 
         FROM public.orders 
         WHERE user_id = $1 AND status NOT IN ('completed', 'cancelled', 'delivered')
         ORDER BY created_at DESC LIMIT 1`,
        [userId]
      )
    ])

    return NextResponse.json({
      orderCount: parseInt(ordersCountRes.rows[0].count),
      favoritesCount: parseInt(favoritesCountRes.rows[0].count),
      activeOrder: activeOrderRes.rows[0] || null
    })
  } catch (error: any) {
    console.error('Profile Stats GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
