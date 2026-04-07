import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { verifyAdmin, createAdminResponse, createAdminError } from '@/lib/auth/admin'

// GET all promotions
export async function GET(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  try {
    const res = await query('SELECT * FROM public.promotions ORDER BY created_at DESC')
    return createAdminResponse({ promotions: res.rows })
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}

// POST create promotion
export async function POST(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  try {
    const body = await req.json()
    const res = await query(
      `INSERT INTO public.promotions (
        title_en, title_ru, description_en, description_ru, 
        discount_percent, code, image_url, valid_from, 
        valid_until, is_active, min_order_amount, max_discount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        body.title_en,
        body.title_ru,
        body.description_en,
        body.description_ru,
        body.discount_percent,
        body.code,
        body.image_url,
        body.valid_from,
        body.valid_until,
        body.is_active ?? true,
        body.min_order_amount || 0,
        body.max_discount
      ]
    )

    return createAdminResponse({ promotion: res.rows[0] }, 201)
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}

// PUT update promotion
export async function PUT(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return createAdminError('Promotion ID is required', 400)
    }

    const keys = Object.keys(updates).filter(k => k !== 'id');
    const values = keys.map(k => updates[k]);
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');

    const res = await query(
      `UPDATE public.promotions SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    )

    if (res.rowCount === 0) {
      return createAdminError('Promotion not found', 404)
    }

    return createAdminResponse({ promotion: res.rows[0] })
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}

// DELETE promotion
export async function DELETE(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return createAdminError('Promotion ID is required', 400)
  }

  try {
    await query('DELETE FROM public.promotions WHERE id = $1', [id])
    return createAdminResponse({ message: 'Promotion deleted successfully' })
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}
