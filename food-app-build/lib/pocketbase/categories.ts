"use server"
import { query } from '@/lib/db';

export async function getGlobalCategories() {
    try {
        // In the new system, we'll fetch from a global categories table or use a flag on categories
        // For now, let's fetch all active categories that could be global
        const res = await query(
            'SELECT * FROM public.categories WHERE is_active = true ORDER BY sort_order ASC'
        );

        return res.rows;
    } catch (error) {
        console.error('Error fetching categories from SQL:', error);
        return [];
    }
}
