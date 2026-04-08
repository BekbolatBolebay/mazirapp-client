export const dynamic = 'force-dynamic'
import { Header } from '@/components/layout/header'
import { SearchBar } from '@/components/home/search-bar'
import { query } from '@/lib/db'
import { HomeClient } from './home-client'
import { Sparkles } from 'lucide-react'

export default async function HomePage() {
  // Use current date for promotion filtering
  const now = new Date().toISOString()

  try {
    const [
      promotionsRes,
      restaurantsRes,
      popularItemsRes,
      categoriesRes
    ] = await Promise.all([
      query(
        'SELECT * FROM public.promotions WHERE is_active = true AND expires_at >= $1 ORDER BY created_at DESC',
        [now]
      ),
      query(
        'SELECT * FROM public.restaurants WHERE is_open = true ORDER BY rating DESC, created_at DESC',
        []
      ),
      query(
        `SELECT m.*, 
                json_build_object('id', r.id, 'name_kk', r.name_kk, 'name_ru', r.name_ru, 'rating', r.rating) as restaurants
         FROM public.menu_items m
         JOIN public.restaurants r ON m.cafe_id = r.id
         WHERE m.is_available = true
         ORDER BY m.created_at DESC
         LIMIT 20`,
        []
      ),
      query(
        'SELECT * FROM public.categories WHERE is_active = true ORDER BY sort_order ASC',
        []
      )
    ])

    const promotions = promotionsRes.rows
    const restaurants = restaurantsRes.rows
    const popularItems = popularItemsRes.rows
    const categories = categoriesRes.rows

    // Top featured for slider
    const featuredRestaurants = restaurants.filter((r: any) => r.rating >= 4.5).slice(0, 5)

    const profile = null
    const user = null

    return (
      <div className="flex flex-col min-h-screen pb-24 bg-[#F8F9FB] dark:bg-background">
        <Header />

        <main className="flex-1">
          <div className="max-w-screen-xl mx-auto px-5 py-6 space-y-8">
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-primary dark:text-primary font-black text-[10px] uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" />
                  <span>Mazir App • Delivery</span>
                </div>
                <h1 className="text-2xl font-black tracking-tight leading-tight uppercase">
                  Тамақ іздеу...
                </h1>
              </div>
            </div>

            <SearchBar />

            <HomeClient 
              promotions={promotions}
              categories={categories}
              featuredRestaurants={featuredRestaurants}
              restaurants={restaurants}
              popularItems={popularItems}
            />
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error('Home Page Error:', error)
    return <div>Error loading home page</div>
  }
}
