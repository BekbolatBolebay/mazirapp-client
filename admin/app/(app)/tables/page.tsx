import { getRestaurantTables } from '@/lib/db'
import { getAdminSession } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import TablesClient from './tables-client'

export default async function TablesPage() {
    const session = await getAdminSession()
    if (!session?.restaurant_id) redirect('/login')
    const restaurantId = session.restaurant_id
    const tables = await getRestaurantTables(restaurantId)

    return <TablesClient
        initialTables={tables}
        restaurantId={restaurantId}
    />
}
