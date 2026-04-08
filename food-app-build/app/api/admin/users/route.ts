import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { verifyAdmin, createAdminResponse, createAdminError } from '@/lib/auth/admin'

// GET all users (staff_profiles)
export async function GET(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')

  try {
    const res = await query(
      'SELECT * FROM public.staff_profiles WHERE ($1::text IS NULL OR role = $1) ORDER BY created_at DESC',
      [role || null]
    )
    return createAdminResponse({ users: res.rows })
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}

// PUT update user role
export async function PUT(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  try {
    const body = await req.json()
    const { id, role } = body

    if (!id || !role) {
      return createAdminError('User ID and role are required', 400)
    }

    const validRoles = ['user', 'admin']
    if (!validRoles.includes(role)) {
      return createAdminError('Invalid role', 400)
    }

    const res = await query(
      'UPDATE public.staff_profiles SET role = $2 WHERE id = $1 RETURNING *',
      [id, role]
    )

    if (res.rowCount === 0) {
      return createAdminError('User not found', 404)
    }

    return createAdminResponse({ user: res.rows[0] })
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}

// DELETE user
export async function DELETE(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return createAdminError('User ID is required', 400)
  }

  try {
    // In a self-hosted PostgreSQL setup, we delete from the users and staff_profiles tables
    // We assume there's a cascade or we do it manually
    await query('DELETE FROM public.staff_profiles WHERE id = $1', [id])
    await query('DELETE FROM public.users WHERE id = $1', [id])

    return createAdminResponse({ success: true, message: 'User deleted successfully' })
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}
