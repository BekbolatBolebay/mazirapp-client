import { getRestaurantClients } from '@/lib/db'
import { getAdminSession } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import ClientsClient from './clients-client'

export default async function ClientsPage() {
    const session = await getAdminSession()
    if (!session?.restaurant_id) redirect('/login')
    const restaurantId = session.restaurant_id
    const clients = await getRestaurantClients(restaurantId)

    return (
        <ClientsClient initialClients={clients} />
    )
}
