import { notFound } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Heart, Star, Clock, MapPin, Phone, Image as ImageIcon, CalendarCheck } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MenuItemCard } from '@/components/restaurant/menu-item-card'
import { FavoriteButton } from '@/components/restaurant/favorite-button'
import { ShareButton } from '@/components/restaurant/share-button'
import { Metadata } from 'next'
import RestaurantMap from '@/components/restaurant/restaurant-map'
import { isRestaurantOpen } from '@/lib/restaurant-utils'
import { CartBar } from '@/components/restaurant/cart-bar'
import { RestaurantReviews } from '@/components/restaurant/restaurant-reviews'
import { RestaurantClient } from './restaurant-client'

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single()

  if (!restaurant) {
    notFound()
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('cafe_id', id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('cafe_id', id)
    .eq('is_available', true)
    .order('sort_order', { ascending: true })

  const { data: workingHours } = await supabase
    .from('working_hours')
    .select('*')
    .eq('cafe_id', id)

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('cafe_id', id)
    .order('created_at', { ascending: false })

  const status = isRestaurantOpen(restaurant.status, workingHours)
  const displayStatus = status.isOpen ? 'Ашық' : 'Жабық'

  const nowAlmatyParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Almaty',
    weekday: 'short'
  }).formatToParts(new Date());
  const weekdayShort = nowAlmatyParts.find(p => p.type === 'weekday')?.value || '';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayIdx = days.indexOf(weekdayShort);

  const timeInfo = workingHours?.find(h => h.day_of_week === todayIdx)
  const workingHoursText = timeInfo && !timeInfo.is_day_off
    ? `${timeInfo.open_time.slice(0, 5)} - ${timeInfo.close_time.slice(0, 5)}`
    : ''

  return (
    <>
      <main className="flex flex-col min-h-screen">
        <RestaurantClient
          restaurant={restaurant}
          categories={categories}
          menuItems={menuItems}
          reviews={reviews}
          status={status}
          workingHoursText={workingHoursText}
        />
      </main>
    </>
  )
}
