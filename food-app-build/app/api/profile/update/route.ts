import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { uploadFile } from '@/lib/storage'
import { v4 as uuidv4 } from 'uuid'
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

    const formData = await req.formData()
    const fullName = formData.get('fullName') as string
    const phone = formData.get('phone') as string
    const avatar = formData.get('avatar') as File | null

    const updates: any = {}
    const params: any[] = []
    let pIdx = 1

    if (fullName) {
      updates.full_name = fullName
    }
    if (phone) {
      updates.phone = phone
    }

    if (avatar) {
      const fileName = `${userId}/${uuidv4()}-${avatar.name}`
      const avatarUrl = await uploadFile(avatar, fileName)
      updates.avatar_url = avatarUrl
    }

    const keys = Object.keys(updates)
    if (keys.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ')
    const values = keys.map(k => updates[k])

    await query(
      `UPDATE public.users SET ${setClause}, updated_at = NOW() WHERE id = $1`,
      [userId, ...values]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Profile Update Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
