import { query } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'mazir_super_secret_jwt_key_2026'

export async function verifyAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('mazir_auth_token')?.value
  
  if (!token) {
    return { authorized: false, user: null }
  }

  try {
    const decoded = verify(token, JWT_SECRET) as any
    
    if (!decoded || !decoded.id) {
      return { authorized: false, user: null }
    }

    // Verify user role in DB
    const res = await query(
      "SELECT id, email, full_name, role FROM public.users WHERE id = $1 AND role IN ('admin', 'super_admin')",
      [decoded.id]
    )
    
    const user = res.rows[0]
    if (!user) {
      return { authorized: false, user: null }
    }
    
    return { authorized: true, user }
  } catch (error) {
    console.error('[verifyAdmin] Token verification failed:', error)
    return { authorized: false, user: null }
  }
}

export async function withAdminAuth(
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const { authorized, user } = await verifyAdmin()
    
    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }
    
    return handler(req, user)
  }
}

export function createAdminResponse(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

export function createAdminError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}
