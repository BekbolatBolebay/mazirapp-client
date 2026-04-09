import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'
import { getPbAdmin } from '@/lib/pocketbase/client'

const JWT_SECRET = process.env.JWT_SECRET || 'mazir_super_secret_jwt_key_2026'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('mazir_auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const decoded = verify(token, JWT_SECRET) as any
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const adminPb = await getPbAdmin()
    const user = await adminPb.collection('users').getOne(decoded.userId)
    
    return NextResponse.json({
      id: user.id,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      phone: user.phone,
      is_anonymous: user.is_anonymous || false,
      role: user.role,
      updated_at: user.updated
    })
  } catch (error: any) {
    console.error('Auth Me Error:', error)
    return NextResponse.json({ error: 'Session expired or User not found' }, { status: 401 })
  }
}
