export const dynamic = "force-dynamic"
import { getCafeSettings } from '@/lib/db'
import { getAdminSession } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import ManagementClient from './management-client'

export default async function ManagementPage() {
  const session = await getAdminSession()
  if (!session?.restaurant_id) redirect('/login')

  const settings = await getCafeSettings(session.restaurant_id)
  return <ManagementClient settings={settings} />
}
