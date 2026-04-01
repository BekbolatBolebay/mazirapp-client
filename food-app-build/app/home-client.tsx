'use client'

import { motion } from 'framer-motion'
import { PromotionBanner } from '@/components/home/promotion-banner'
import { CategoryGrid } from '@/components/home/category-grid'
import { RestaurantSection } from '@/components/home/restaurant-section'
import { FoodSection } from '@/components/home/food-section'
import { FeaturedSlider } from '@/components/home/featured-slider'

interface HomeClientProps {
  promotions: any[] | null
  categories: any[]
  featuredRestaurants: any[]
  restaurants: any[] | null
  popularItems: any[] | null
}

export function HomeClient({
  promotions,
  categories,
  featuredRestaurants,
  restaurants,
  popularItems
}: HomeClientProps) {
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      {/* Promotions */}
      {promotions && promotions.length > 0 && (
        <motion.div variants={item}>
          <PromotionBanner promotions={promotions} />
        </motion.div>
      )}

      {/* Featured Slider */}
      {featuredRestaurants.length > 0 && (
        <motion.div variants={item}>
          <FeaturedSlider restaurants={featuredRestaurants} />
        </motion.div>
      )}

      {/* Categories */}
      <motion.div variants={item}>
        <CategoryGrid initialCategories={categories} />
      </motion.div>

      {/* Main Restaurants */}
      {restaurants && restaurants.length > 0 && (
        <motion.div variants={item}>
          <RestaurantSection restaurants={restaurants} />
        </motion.div>
      )}

      {/* Popular Items */}
      {popularItems && popularItems.length > 0 && (
        <motion.div variants={item}>
          <FoodSection title="Popular Items" items={popularItems} />
        </motion.div>
      )}
    </motion.div>
  )
}
