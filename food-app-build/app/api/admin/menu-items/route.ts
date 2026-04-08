import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { verifyAdmin, createAdminResponse, createAdminError } from '@/lib/auth/admin'

// GET all menu items (with optional restaurant filter)
export async function GET(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  const { searchParams } = new URL(req.url)
  const restaurantId = searchParams.get('cafe_id')

  try {
    // We use a JOIN to mimic the Supabase nested structure
    const sql = `
      SELECT mi.*, 
             (SELECT json_build_object('name_en', r.name_en, 'name_ru', r.name_ru) 
              FROM public.restaurants r WHERE r.id = mi.cafe_id) as restaurants,
             (SELECT json_build_object('name_kk', c.name_kk, 'name_ru', c.name_ru, 'name_en', c.name_en) 
              FROM public.categories c WHERE c.id = mi.category_id) as categories
      FROM public.menu_items mi
      WHERE ($1::uuid IS NULL OR mi.cafe_id = $1)
      ORDER BY mi.created_at DESC
    `;
    
    const res = await query(sql, [restaurantId || null])
    return createAdminResponse({ menuItems: res.rows })
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}

// POST create menu item
export async function POST(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  try {
    const body = await req.json()
    const res = await query(
      `INSERT INTO public.menu_items (
        cafe_id, category_id, name_kk, name_ru, name_en, 
        description_kk, description_ru, description_en, 
        price, image_url, is_available, is_popular
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        body.cafe_id,
        body.category_id || body.category,
        body.name_kk || body.name_en,
        body.name_ru,
        body.name_en,
        body.description_kk || body.description_en,
        body.description_ru,
        body.description_en,
        body.price,
        body.image_url,
        body.is_available ?? true,
        body.is_popular ?? false
      ]
    )

    return createAdminResponse({ menuItem: res.rows[0] }, 201)
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}

// PUT update menu item
export async function PUT(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return createAdminError('Menu item ID is required', 400)
    }

    const keys = Object.keys(updates).filter(k => k !== 'id');
    const values = keys.map(k => updates[k]);
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');

    const res = await query(
      `UPDATE public.menu_items SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    )

    if (res.rowCount === 0) {
      return createAdminError('Menu item not found', 404)
    }

    return createAdminResponse({ menuItem: res.rows[0] })
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}

// DELETE menu item
export async function DELETE(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return createAdminError('Menu item ID is required', 400)
  }

  try {
    await query('DELETE FROM public.menu_items WHERE id = $1', [id])
    return createAdminResponse({ message: 'Menu item deleted successfully' })
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}
