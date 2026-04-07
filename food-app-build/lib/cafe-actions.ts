'use server'

import { query } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentRestaurantId } from './cafe-db'

export async function addMenuItem(payload: any) {
    const restaurantId = await getCurrentRestaurantId()
    if (!restaurantId) return { data: null, error: new Error('Unauthorized') }

    try {
        const columns = Object.keys(payload)
        const values = Object.values(payload)
        const placeholders = values.map((_, i) => `$${i + 2}`).join(', ')
        
        const res = await query(
            `INSERT INTO public.menu_items (cafe_id, ${columns.join(', ')}) 
             VALUES ($1, ${placeholders}) 
             RETURNING *`,
            [restaurantId, ...values]
        )
        
        revalidatePath('/manage/menu')
        return { data: res.rows[0], error: null }
    } catch (error: any) {
        console.error('Add Menu Item Error:', error)
        return { data: null, error }
    }
}

export async function updateMenuItem(id: string, payload: any) {
    try {
        const columns = Object.keys(payload)
        const values = Object.values(payload)
        const setClause = columns.map((col, i) => `${col} = $${i + 2}`).join(', ')
        
        const res = await query(
            `UPDATE public.menu_items SET ${setClause} WHERE id = $1 RETURNING *`,
            [id, ...values]
        )
        
        revalidatePath('/manage/menu')
        return { data: res.rows[0], error: null }
    } catch (error: any) {
        console.error('Update Menu Item Error:', error)
        return { data: null, error }
    }
}

export async function deleteMenuItem(id: string) {
    try {
        await query('DELETE FROM public.menu_items WHERE id = $1', [id])
        revalidatePath('/manage/menu')
        return { error: null }
    } catch (error: any) {
        console.error('Delete Menu Item Error:', error)
        return { error }
    }
}
