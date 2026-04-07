export const dynamic = "force-dynamic"
import { getOrders, getMenuItems } from '@/lib/db'
import { getAdminSession } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import AnalyticsClient from './analytics-client'

export default async function AnalyticsPage() {
  const session = await getAdminSession()
  if (!session?.restaurant_id) redirect('/login')
  const rid = session.restaurant_id

  const [orders, items] = await Promise.all([
    getOrders(rid),
    getMenuItems(rid)
  ])
  return <AnalyticsClient orders={orders} menuItems={items} />
}
