import { getPromotions, getBanners } from '@/lib/db'
import { getAdminSession } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import MarketingClient from './marketing-client'

export default async function MarketingPage() {
    const session = await getAdminSession()
    if (!session?.restaurant_id) redirect('/login')
    const restaurantId = session.restaurant_id

    const [promotions, banners] = await Promise.all([
        getPromotions(restaurantId),
        getBanners(restaurantId),
    ])

    return (
        <MarketingClient
            initialPromoCodes={promotions}
            initialBanners={banners}
        />
    )
}
