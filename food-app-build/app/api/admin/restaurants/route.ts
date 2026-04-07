import { NextRequest } from 'next/server'
import { verifyAdmin, createAdminResponse, createAdminError } from '@/lib/auth/admin'
import { query } from '@/lib/db'

// GET all restaurants
export async function GET(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  const res = await query(
    'SELECT * FROM public.restaurants ORDER BY created_at DESC'
  )

  return createAdminResponse({ restaurants: res.rows })
}

// POST create restaurant
export async function POST(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  try {
    const body = await req.json()
    
    const res = await query(
      `INSERT INTO public.restaurants (
        name_kk, name_ru, name_en, 
        description_kk, description_ru, description_en,
        address, phone, image_url, banner_url,
        rating, delivery_time_min, delivery_time_max, 
        delivery_fee, minimum_order, is_open, 
        opening_hours, cuisine_types
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        body.name_kk || body.name_en,
        body.name_ru,
        body.name_en,
        body.description_kk || body.description_en,
        body.description_ru,
        body.description_en,
        body.address,
        body.phone,
        body.image_url,
        body.banner_url || body.image_url,
        body.rating || 0,
        body.delivery_time_min || 20,
        body.delivery_time_max || 40,
        body.delivery_fee || 0,
        body.minimum_order || 0,
        body.is_open ?? true,
        body.opening_hours,
        body.cuisine_types || body.categories || [],
      ]
    )

    return createAdminResponse({ restaurant: res.rows[0] }, 201)
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}

// PUT update restaurant
export async function PUT(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return createAdminError('Restaurant ID is required', 400)
    }

    // Build dynamic update query
    const keys = Object.keys(updates)
    if (keys.length === 0) {
        return createAdminError('No updates provided', 400)
    }

    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ')
    const values = [id, ...Object.values(updates)]

    const res = await query(
      `UPDATE public.restaurants SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    )

    if (res.rowCount === 0) {
      return createAdminError('Restaurant not found', 404)
    }

    return createAdminResponse({ restaurant: res.rows[0] })
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}

// DELETE restaurant
export async function DELETE(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return createAdminError('Restaurant ID is required', 400)
  }

  const res = await query(
    'DELETE FROM public.restaurants WHERE id = $1',
    [id]
  )

  if (res.rowCount === 0) {
    return createAdminError('Restaurant not found', 404)
  }

  return createAdminResponse({ message: 'Restaurant deleted successfully' })
}
