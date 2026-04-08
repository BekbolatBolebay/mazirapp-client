import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'mazir_super_secret_jwt_key_2026'

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

    const res = await query(
      'SELECT * FROM user_cards WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC',
      [userId]
    )

    return NextResponse.json({ cards: res.rows })
  } catch (error: any) {
    console.error('User Cards GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
