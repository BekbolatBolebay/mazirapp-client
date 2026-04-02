'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getUserOrders, getUserReservations, subscribeToOrders } from '@/lib/pocketbase/orders'
import { Header } from '@/components/layout/header'
import { OrderCard } from '@/components/orders/order-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Loader2, Package, CheckCircle2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReservationCard } from '@/components/orders/reservation-card'
import { useAuth } from '@/lib/auth/auth-context'

export default function OrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const initialTab = searchParams.get('tab') || 'all'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [orders, setOrders] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAllData = async () => {
    try {
      const savedPhone = localStorage.getItem('customer_phone') || undefined

      // Fetch Orders using PocketBase
      const uniqueOrders = await getUserOrders(user?.id, savedPhone)
      setOrders(uniqueOrders)

      // Fetch Reservations using PocketBase
      const uniqueReservations = await getUserReservations(user?.id, savedPhone)
      setReservations(uniqueReservations)

    } catch (err) {
      console.error('Fetch data error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()

    // Real-time updates using PocketBase
    const unsubscribe = subscribeToOrders(() => {
        fetchAllData()
    })

    return () => {
      unsubscribe()
    }
  }, [user])

  const activeOrders = orders.filter((o) =>
    ['pending', 'new', 'accepted', 'preparing', 'ready', 'awaiting_payment', 'on_the_way', 'delivering'].includes(o.status)
  )
  const completedOrders = orders.filter((o) => ['delivered', 'completed', 'cancelled'].includes(o.status))

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen pb-16 bg-background">
        <Header title={t.orders.title} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-background transition-colors duration-500">
      <Header title={t.orders.title} />

      <main className="flex-1 overflow-auto max-w-screen-xl mx-auto w-full px-4 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-[env(safe-area-inset-top)] z-40 pb-4 bg-background/80 backdrop-blur-xl">
            <TabsList className="w-full grid grid-cols-4 bg-muted/50 border border-border rounded-2xl p-1 h-12 shadow-sm">
              <TabsTrigger value="all" className="rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                {t.orders.all}
              </TabsTrigger>
              <TabsTrigger value="active" className="rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                {t.orders.active} 
                {activeOrders.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] rounded-full border border-primary/20">
                    {activeOrders.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                {t.orders.completed}
              </TabsTrigger>
              <TabsTrigger value="bookings" className="rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                {locale === 'kk' ? 'Бронь' : 'Брони'}
                {reservations.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] rounded-full border border-primary/20">
                    {reservations.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-4 focus-visible:outline-none pb-10">
            {orders.length > 0 ? orders.map(o => <Link key={o.id} href={`/orders/${o.id}`} className="block transition-transform active:scale-[0.98]"><OrderCard order={o} /></Link>) : <EmptyOrders t={t} />}
          </TabsContent>
          <TabsContent value="active" className="space-y-4 focus-visible:outline-none pb-10">
            {activeOrders.length > 0 ? activeOrders.map(o => <Link key={o.id} href={`/orders/${o.id}`} className="block transition-transform active:scale-[0.98]"><OrderCard order={o} /></Link>) : <EmptyState icon={<Loader2 className="w-10 h-10 text-primary/40 animate-spin" />} title={t.orders.no_active_orders} />}
          </TabsContent>
          <TabsContent value="completed" className="space-y-4 focus-visible:outline-none pb-10">
            {completedOrders.length > 0 ? completedOrders.map(o => <Link key={o.id} href={`/orders/${o.id}`} className="block transition-transform active:scale-[0.98]"><OrderCard order={o} /></Link>) : <EmptyState icon={<CheckCircle2 className="w-10 h-10 text-emerald-500/40" />} title={t.orders.no_completed_orders} />}
          </TabsContent>
          <TabsContent value="bookings" className="space-y-4 focus-visible:outline-none pb-10">
            {reservations.length > 0 ? (
              reservations.map(res => (
                <Link key={res.id} href={`/reservations/${res.id}`} className="block transition-transform active:scale-[0.98]">
                  <ReservationCard reservation={res} />
                </Link>
              ))
            ) : (
              <EmptyState
                icon={<Calendar className="w-10 h-10 text-primary/40" />}
                title={locale === 'kk' ? 'Брондаулар жоқ' : 'Бронирований нет'}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function EmptyOrders({ t }: { t: any }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-24 h-24 bg-muted border border-border rounded-[2.5rem] flex items-center justify-center shadow-inner mb-6 rotate-3">
        <Package className="w-12 h-12 text-muted-foreground/40" />
      </div>
      <h2 className="text-2xl font-black text-foreground mb-3 tracking-tight">{t.orders.no_orders}</h2>
      <p className="text-muted-foreground mb-10 max-w-xs mx-auto text-sm font-medium leading-relaxed">{t.orders.no_orders_desc}</p>
      <Button asChild className="rounded-2xl px-12 h-14 font-black shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
        <Link href="/">{t.orders.go_to_menu}</Link>
      </Button>
    </div>
  )
}

function EmptyState({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-24 h-24 bg-muted border border-border rounded-[2.5rem] flex items-center justify-center shadow-inner mb-6">
        {icon}
      </div>
      <h2 className="text-xl font-black text-muted-foreground/60 mb-2 tracking-tight">{title}</h2>
    </div>
  )
}
