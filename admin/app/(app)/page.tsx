export const dynamic = "force-dynamic"
import { getCafeSettings, getOrdersStats, getOrders } from '@/lib/db'
import { getAdminSession } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import DashboardClient from './dashboard-client'

export default async function HomePage() {
  const session = await getAdminSession()
  if (!session) redirect('/login')

  const rid = session.restaurant_id
  if (!rid) {
    console.error('[HomePage] Missing restaurant_id in session')
    redirect('/login')
  }

  const [settings, stats, recentOrders] = await Promise.all([
    getCafeSettings(rid),
    getOrdersStats(rid),
    getOrders(rid),
  ])

  const recent = recentOrders.slice(0, 5)

  return (
    <DashboardClient
      settings={settings}
      stats={stats}
      recentOrders={recent}
    />
  )
}
