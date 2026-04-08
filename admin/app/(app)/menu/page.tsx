export const dynamic = "force-dynamic"
import { getMenuItems, getMenuCategories } from '@/lib/db'
import { getAdminSession } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import { DEFAULT_CATEGORIES } from '@/lib/constants'
import { seedDefaultCategories } from '@/lib/actions'
import MenuClient from './menu-client'

export default async function MenuPage() {
  const session = await getAdminSession()
  if (!session?.restaurant_id) redirect('/login')
  const restaurantId = session.restaurant_id

  const [items, dbCategories] = await Promise.all([
    getMenuItems(restaurantId), 
    getMenuCategories(restaurantId)
  ])

  // DB-де категориялар жоқ болса, автоматты тұқым ету + fallback
  let categories: any[] = dbCategories
  if (dbCategories.length === 0) {
    // Автоматты тұқым ету (SQL скрипті іске қосылмаған болса)
    await seedDefaultCategories(restaurantId)
    const seeded = await getMenuCategories(restaurantId)
    // DB-дан алынған болса оларды қолдан, болмаса DEFAULT_CATEGORIES-ті форма үшін қолдан
    categories = seeded.length > 0 ? seeded : DEFAULT_CATEGORIES.map((c, i) => ({
      id: `default-${i}`,
      cafe_id: restaurantId,
      name_kk: c.name_kk,
      name_ru: c.name_ru,
      name_en: c.name_en,
      icon_url: '',
      sort_order: c.sort_order,
      is_active: true,
      created_at: '',
    }))
  }

  return <MenuClient initialItems={items} initialCategories={categories} restaurantId={restaurantId} />
}

