import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
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
    let query = supabase
      .from('menu_items')
      .select(`
        *,
        restaurants:cafe_id (name_en, name_ru),
        categories:category_id (name_kk, name_ru, name_en)
      `)
      .order('created_at', { ascending: false });

    if (restaurantId) {
      query = query.eq('cafe_id', restaurantId);
    }
    
    const { data, error } = await query;
    if (error) throw error;

    return createAdminResponse({ menuItems: data })
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
    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        cafe_id: body.cafe_id,
        category_id: body.category_id || body.category,
        name_kk: body.name_kk || body.name_en,
        name_ru: body.name_ru,
        name_en: body.name_en,
        description_kk: body.description_kk || body.description_en,
        description_ru: body.description_ru,
        description_en: body.description_en,
        price: body.price,
        image_url: body.image_url,
        is_available: body.is_available ?? true,
        is_popular: body.is_popular ?? false
      })
      .select()
      .single();

    if (error) throw error;

    return createAdminResponse({ menuItem: data }, 201)
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

    const { data, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return createAdminResponse({ menuItem: data })
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
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return createAdminResponse({ message: 'Menu item deleted successfully' })
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}
