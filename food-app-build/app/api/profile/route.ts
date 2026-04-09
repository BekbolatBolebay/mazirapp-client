import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { getPbAdmin } from '@/lib/pocketbase/client'

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

    const adminPb = await getPbAdmin()
    const user = await adminPb.collection('users').getOne(userId);
    
    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        phone: user.phone,
        role: user.role,
        created_at: user.created
      } 
    })
  } catch (error: any) {
    console.error('Profile GET Error:', error)
    return NextResponse.json({ error: 'User not found or Session expired' }, { status: 404 })
  }
}

export async function PUT(req: NextRequest) {
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
    const { full_name, phone, push_subscription } = body

    const adminPb = await getPbAdmin()
    
    let updatedUser;
    if (push_subscription !== undefined) {
      updatedUser = await adminPb.collection('users').update(userId, {
        push_subscription: push_subscription
      })
    } else {
      if (!full_name || !phone) {
        return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
      }
      updatedUser = await adminPb.collection('users').update(userId, {
        full_name: full_name,
        phone: phone
      })
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.full_name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        created_at: updatedUser.created
      } 
    })
  } catch (error: any) {
    console.error('Profile PUT Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
