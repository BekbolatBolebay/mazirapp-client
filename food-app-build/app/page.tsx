export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { SearchBar } from '@/components/home/search-bar'
import { PromotionBanner } from '@/components/home/promotion-banner'
import { CategoryGrid } from '@/components/home/category-grid'
import { RestaurantSection } from '@/components/home/restaurant-section'
import { FoodSection } from '@/components/home/food-section'
import { FeaturedSlider } from '@/components/home/featured-slider'
import pb from '@/utils/pocketbase'
import { getGlobalCategories } from '@/lib/supabase/categories'
import { MapPin, ChevronDown, Sparkles } from 'lucide-react'
import { HomeClient } from './home-client'

export default async function HomePage() {
  // Get user for personal greeting
  const user = pb.authStore.model
  let profile = null
  if (user) {
      profile = { full_name: user.full_name || user.name }
  }

  const [
    promotions,
    restaurants,
    popularItems,
    categories
  ] = await Promise.all([
    pb.collection('promotions').getFullList({
      filter: `is_active = true && end_date >= "${new Date().toISOString()}"`,
      sort: '-created_at',
      requestKey: null
    }),
    pb.collection('restaurants').getFullList({
      filter: 'is_open = true',
      sort: 'rating, -created_at',
      requestKey: null
    }),
    pb.collection('menu_items').getFullList({
      filter: 'is_available = true',
      sort: '-created_at',
      expand: 'cafe_id',
      requestKey: null
    }),
    getGlobalCategories()
  ])

  // Map popular items to include restaurant data from expand
  const mappedPopularItems = popularItems.map(item => ({
      ...item,
      restaurants: item.expand?.cafe_id || null
  }))

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
            popularItems={mappedPopularItems}
          />
        </div>
      </main>
    </div>
  )
}
