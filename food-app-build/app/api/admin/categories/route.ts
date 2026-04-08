import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { verifyAdmin, createAdminResponse, createAdminError } from '@/lib/auth/admin'

// GET all global categories (cafe_id is null)
export async function GET(req: NextRequest) {
    const { authorized } = await verifyAdmin()
    if (!authorized) {
        return createAdminError('Unauthorized', 403)
    }

    try {
        const res = await query(
            'SELECT * FROM public.categories WHERE cafe_id IS NULL ORDER BY sort_order ASC'
        )
        return createAdminResponse({ categories: res.rows })
    } catch (error: any) {
        return createAdminError(error.message, 500)
    }
}

// POST create global category
export async function POST(req: NextRequest) {
    const { authorized } = await verifyAdmin()
    if (!authorized) {
        return createAdminError('Unauthorized', 403)
    }

    try {
        const body = await req.json()
        const res = await query(
            `INSERT INTO public.categories (name_kk, name_ru, name_en, icon_url, sort_order, is_active, cafe_id) 
             VALUES ($1, $2, $3, $4, $5, $6, NULL) RETURNING *`,
            [
                body.name_kk,
                body.name_ru,
                body.name_en || body.name_ru,
                body.icon_url || '',
                body.sort_order || 0,
                body.is_active ?? true
            ]
        )

        return createAdminResponse({ category: res.rows[0] }, 201)
    } catch (error: any) {
        return createAdminError(error.message, 500)
    }
}

// PUT update category
export async function PUT(req: NextRequest) {
    const { authorized } = await verifyAdmin()
    if (!authorized) {
        return createAdminError('Unauthorized', 403)
    }

    try {
        const body = await req.json()
        const { id, ...updates } = body

        if (!id) {
            return createAdminError('Category ID is required', 400)
        }

        // Simple dynamic update (or we could just list all fields)
        const keys = Object.keys(updates).filter(k => k !== 'id');
        const values = keys.map(k => updates[k]);
        const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');

        const res = await query(
            `UPDATE public.categories SET ${setClause} WHERE id = $1 RETURNING *`,
            [id, ...values]
        )

        if (res.rowCount === 0) {
            return createAdminError('Category not found', 404)
        }

        return createAdminResponse({ category: res.rows[0] })
    } catch (error: any) {
        return createAdminError(error.message, 500)
    }
}

// DELETE category
export async function DELETE(req: NextRequest) {
    const { authorized } = await verifyAdmin()
    if (!authorized) {
        return createAdminError('Unauthorized', 403)
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
        return createAdminError('Category ID is required', 400)
    }

    try {
        await query('DELETE FROM public.categories WHERE id = $1', [id])
        return createAdminResponse({ message: 'Category deleted successfully' })
    } catch (error: any) {
        return createAdminError(error.message, 500)
    }
}
