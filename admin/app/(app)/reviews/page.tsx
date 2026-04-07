import { getReviews, getCafeSettings } from '@/lib/db'
import { getAdminSession } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import ReviewsClient from './reviews-client'

export default async function ReviewsPage() {
    const session = await getAdminSession()
    if (!session?.restaurant_id) redirect('/login')
    const restaurantId = session.restaurant_id

    const [reviews, restaurant] = await Promise.all([
        getReviews(restaurantId),
        getCafeSettings(restaurantId)
    ])

    return (
        <ReviewsClient initialReviews={reviews} restaurant={restaurant} />
    )
}
