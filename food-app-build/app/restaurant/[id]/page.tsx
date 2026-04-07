export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { query } from '@/lib/db'
import { isRestaurantOpen } from '@/lib/restaurant-utils'
import { RestaurantClient } from './restaurant-client'

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const restaurantRes = await query('SELECT * FROM restaurants WHERE id = $1', [id])
    const restaurant = restaurantRes.rows[0]

    if (!restaurant) {
      notFound()
    }

    const categoriesRes = await query(
      'SELECT * FROM categories WHERE cafe_id = $1 AND is_active = true ORDER BY sort_order ASC',
      [id]
    )

    const menuItemsRes = await query(
      'SELECT * FROM menu_items WHERE cafe_id = $1 AND is_available = true ORDER BY sort_order ASC',
      [id]
    )

    const workingHoursRes = await query(
      'SELECT * FROM working_hours WHERE cafe_id = $1',
      [id]
    )

    const reviewsRes = await query(
      'SELECT * FROM reviews WHERE cafe_id = $1 ORDER BY created_at DESC',
      [id]
    )

    const status = isRestaurantOpen(restaurant.status, workingHoursRes.rows)
    
    // Get today's working hours text
    const nowAlmatyParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Almaty',
      weekday: 'short'
    }).formatToParts(new Date());
    const weekdayShort = nowAlmatyParts.find(p => p.type === 'weekday')?.value || '';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayIdx = days.indexOf(weekdayShort);

    const timeInfo = workingHoursRes.rows?.find((h: any) => h.day_of_week === todayIdx)
    const workingHoursText = timeInfo && !timeInfo.is_day_off
      ? `${timeInfo.open_time.slice(0, 5)} - ${timeInfo.close_time.slice(0, 5)}`
      : ''

    return (
      <main className="flex flex-col min-h-screen">
        <RestaurantClient
          restaurant={restaurant}
          categories={categoriesRes.rows}
          menuItems={menuItemsRes.rows}
          reviews={reviewsRes.rows}
          status={status}
          workingHoursText={workingHoursText}
        />
      </main>
    )
  } catch (error) {
    console.error('Error fetching restaurant data:', error)
    notFound()
  }
}
