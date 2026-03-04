import { createClient } from '@/lib/supabase/client'

export async function getGlobalCategories() {
    const supabase = createClient()

    // Get unique category names (KK and RU) from all active categories
    const { data, error } = await supabase
        .from('categories')
        .select('name_kk, name_ru')
        .eq('is_active', true)

    if (error || !data) return []

    // Unique by name_ru for consistency in grouping
    const unique = Array.from(new Set(data.map(c => c.name_ru))).map(nameRu => {
        const original = data.find(c => c.name_ru === nameRu)
        return {
            name_ru: nameRu,
            name_kk: original?.name_kk || nameRu
        }
    })

    return unique
}
