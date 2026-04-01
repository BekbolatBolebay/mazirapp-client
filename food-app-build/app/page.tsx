export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { SearchBar } from '@/components/home/search-bar'
import { PromotionBanner } from '@/components/home/promotion-banner'
import { CategoryGrid } from '@/components/home/category-grid'
import { RestaurantSection } from '@/components/home/restaurant-section'
import { FoodSection } from '@/components/home/food-section'
import { FeaturedSlider } from '@/components/home/featured-slider'
import { createClient } from '@/lib/supabase/server'
import { getGlobalCategories } from '@/lib/supabase/categories'
import { MapPin, ChevronDown, Sparkles } from 'lucide-react'
import { HomeClient } from './home-client'

export default async function HomePage() {
  const supabase = await createClient()

  // Get user for personal greeting
  const { data: { user } } = await supabase.auth.getUser()
  let profile = null
  if (user) {
    const { data } = await supabase.from('clients').select('full_name').eq('id', user.id).single()
    profile = data
  }

  const [
    { data: promotions },
    { data: restaurants },
    { data: popularItems },
    categories
  ] = await Promise.all([
    supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('restaurants')
      .select('*')
      .eq('is_open', true)
      .order('rating', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('menu_items')
      .select('*, restaurants(*)')
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(10),
    getGlobalCategories()
  ])

  // Top featured for slider
  const featuredRestaurants = restaurants?.filter(r => r.rating >= 4.5).slice(0, 5) || []

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-[#F8F9FB] dark:bg-background">
      <Header />

      <main className="flex-1">
        <div className="max-w-screen-xl mx-auto px-5 py-6 space-y-8">
          
          {/* Welcome & Context Area */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-primary dark:text-primary font-black text-[10px] uppercase tracking-widest">
                <Sparkles className="w-3 h-3" />
                <span>Mazir App • Delivery</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight leading-tight uppercase">
                {profile?.full_name 
                  ? `Сәлем, ${profile.full_name.split(' ')[0]}!` 
                  : (user ? 'Сәлем!' : 'Тамақ іздеу...')}
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
}
