import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const userId = decoded.userId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const res = await query(
      `SELECT id, status, order_number 
       FROM public.orders 
       WHERE user_id = $1 AND status NOT IN ('completed', 'cancelled')
       ORDER BY updated_at DESC`,
      [userId]
    )

    return NextResponse.json({ orders: res.rows })
  } catch (error: any) {
    console.error('Active Orders GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
