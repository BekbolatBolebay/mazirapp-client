import BottomNav from '@/components/layout/bottom-nav'
import { SubscriptionGuard } from '@/components/layout/subscription-guard'
import { getCafeSettings } from '@/lib/db'
import { getAdminSession } from '@/lib/auth-utils'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()
  const settings = session?.restaurant_id 
    ? await getCafeSettings(session.restaurant_id)
    : null

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-screen-xl relative min-h-screen flex flex-col px-0 sm:px-6 lg:px-8">
        <SubscriptionGuard restaurant={settings}>
          <main className="flex-1 overflow-y-auto pb-24 pt-2 md:pt-8 lg:pt-12">
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-0">
              {children}
            </div>
          </main>
          <BottomNav />
        </SubscriptionGuard>
      </div>
    </div>
  )
}
