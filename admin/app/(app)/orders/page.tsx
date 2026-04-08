export const dynamic = "force-dynamic"
import { getOrders, getReservations, getCafeSettings } from '@/lib/db'
import { getAdminSession } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import OrdersClient from './orders-client'

export default async function OrdersPage() {
  const session = await getAdminSession()
  if (!session?.restaurant_id) redirect('/login')
  const rid = session.restaurant_id

  const [orders, reservations, settings] = await Promise.all([
    getOrders(rid),
    getReservations(rid),
    getCafeSettings(rid)
  ])

  return <OrdersClient
    initialOrders={orders}
    initialReservations={reservations}
    restaurant={settings}
  />
}
