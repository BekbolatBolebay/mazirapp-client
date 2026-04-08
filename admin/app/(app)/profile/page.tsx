export const dynamic = "force-dynamic"
import { getCafeSettings, getWorkingHours, getUserProfile } from '@/lib/db'
import { getAdminSession } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import ProfileClient from './profile-client'

export default async function ProfilePage() {
  const session = await getAdminSession()
  if (!session) redirect('/login')

  const { id: userId, restaurant_id: rid } = session

  const [settings, hours, userProfile] = await Promise.all([
    getCafeSettings(rid),
    getWorkingHours(rid),
    getUserProfile(userId)
  ])
  return <ProfileClient settings={settings} workingHours={hours} userProfile={userProfile} />
}
