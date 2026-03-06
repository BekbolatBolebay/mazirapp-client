'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { OrderCard } from '@/components/orders/order-card'
import { ReservationCard } from '@/components/orders/reservation-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Loader2, Package, CheckCircle2, UtensilsCrossed, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function OrdersPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [orders, setOrders] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mainTab, setMainTab] = useState<'orders' | 'bookings'>('orders')

  const fetchAllData = async () => {
    const supabase = createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const savedPhone = localStorage.getItem('customer_phone')

      // 1. Fetch Orders
      let userOrders: any[] = []
      if (user) {
        const { data } = await supabase
          .from('orders')
          .select('*, restaurants!restaurant_id (*), order_items (*, menu_items (*))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (data) userOrders = data
      }

      let phoneOrders: any[] = []
      if (savedPhone) {
        const { data } = await supabase
          .from('orders')
          .select('*, restaurants!restaurant_id (*), order_items (*, menu_items (*))')
          .eq('customer_phone', savedPhone)
          .order('created_at', { ascending: false })
        if (data) phoneOrders = data
      }

      const uniqueOrders = Array.from(new Map([...userOrders, ...phoneOrders].map(o => [o.id, o])).values())
      setOrders(uniqueOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))

      // 2. Fetch Reservations
      let userReservations: any[] = []
      if (user) {
        const { data } = await supabase
          .from('reservations')
          .select('*, restaurants!restaurant_id (*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (data) userReservations = data
      }

      let phoneReservations: any[] = []
      if (savedPhone) {
        const { data } = await supabase
          .from('reservations')
          .select('*, restaurants!restaurant_id (*)')
          .eq('customer_phone', savedPhone)
          .order('created_at', { ascending: false })
        if (data) phoneReservations = data
      }

      const uniqueReservations = Array.from(new Map([...userReservations, ...phoneReservations].map(r => [r.id, r])).values())
      setReservations(uniqueReservations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))

    } catch (err) {
      console.error('Fetch data error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
    const supabase = createClient()

    const ordersChannel = supabase
      .channel('orders-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchAllData)
      .subscribe()

    const reservationsChannel = supabase
      .channel('reservations-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, fetchAllData)
      .subscribe()

    return () => {
      supabase.removeChannel(ordersChannel)
      supabase.removeChannel(reservationsChannel)
    }
  }, [])

  const activeOrders = orders.filter((o) =>
    ['pending', 'new', 'accepted', 'preparing', 'ready', 'awaiting_payment', 'on_the_way', 'delivering'].includes(o.status)
  )
  const completedOrders = orders.filter((o) => ['delivered', 'completed', 'cancelled'].includes(o.status))

  const activeReservations = reservations.filter((r) => ['pending', 'awaiting_payment', 'accepted', 'confirmed'].includes(r.status))
  const completedReservations = reservations.filter((r) => ['completed', 'cancelled', 'noshow'].includes(r.status))

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen pb-16 bg-muted/30">
        <Header title={t.orders.title} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-muted/30">
      <Header title={t.orders.title} />

      {/* Main Tabs Segmented Control */}
      <div className="px-6 py-4 bg-card border-b">
        <div className="flex bg-muted/50 p-1 rounded-2xl border border-border/50">
          <button
            onClick={() => setMainTab('orders')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
              mainTab === 'orders' ? "bg-card shadow-sm text-primary" : "text-muted-foreground"
            )}
          >
            <UtensilsCrossed className="w-4 h-4" />
            Тапсырыстар
          </button>
          <button
            onClick={() => setMainTab('bookings')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
              mainTab === 'bookings' ? "bg-card shadow-sm text-primary" : "text-muted-foreground"
            )}
          >
            <CalendarDays className="w-4 h-4" />
            Брондау
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-auto max-w-screen-xl mx-auto w-full px-4 pt-4">
        {mainTab === 'orders' ? (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-6 bg-card border shadow-sm rounded-2xl p-1 h-12">
              <TabsTrigger value="all" className="rounded-xl font-bold">{t.orders.all}</TabsTrigger>
              <TabsTrigger value="active" className="rounded-xl font-bold">
                {t.orders.active} {activeOrders.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full">{activeOrders.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-xl font-bold">{t.orders.completed}</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 focus-visible:outline-none pb-10">
              {orders.length > 0 ? orders.map(o => <Link key={o.id} href={`/orders/${o.id}`}><OrderCard order={o} /></Link>) : <EmptyOrders t={t} />}
            </TabsContent>
            <TabsContent value="active" className="space-y-4 focus-visible:outline-none pb-10">
              {activeOrders.length > 0 ? activeOrders.map(o => <Link key={o.id} href={`/orders/${o.id}`}><OrderCard order={o} /></Link>) : <EmptyState icon={<Loader2 className="w-10 h-10 text-primary/40 animate-spin" />} title={t.orders.no_active_orders} />}
            </TabsContent>
            <TabsContent value="completed" className="space-y-4 focus-visible:outline-none pb-10">
              {completedOrders.length > 0 ? completedOrders.map(o => <Link key={o.id} href={`/orders/${o.id}`}><OrderCard order={o} /></Link>) : <EmptyState icon={<CheckCircle2 className="w-10 h-10 text-emerald-500/40" />} title={t.orders.no_completed_orders} />}
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-6 bg-card border shadow-sm rounded-2xl p-1 h-12">
              <TabsTrigger value="all" className="rounded-xl font-bold">{t.orders.all}</TabsTrigger>
              <TabsTrigger value="active" className="rounded-xl font-bold">
                {t.orders.active} {activeReservations.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full">{activeReservations.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-xl font-bold">{t.orders.completed}</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 focus-visible:outline-none pb-10">
              {reservations.length > 0 ? reservations.map(r => <Link key={r.id} href={`/booking/${r.restaurant_id}?reservationId=${r.id}`}><ReservationCard reservation={r} /></Link>) : <EmptyState icon={<CalendarDays className="w-10 h-10 text-muted-foreground/40" />} title="Брондау тарихы бос" />}
            </TabsContent>
            <TabsContent value="active" className="space-y-4 focus-visible:outline-none pb-10">
              {activeReservations.length > 0 ? activeReservations.map(r => <Link key={r.id} href={`/booking/${r.restaurant_id}?reservationId=${r.id}`}><ReservationCard reservation={r} /></Link>) : <EmptyState icon={<Loader2 className="w-10 h-10 text-primary/40 animate-spin" />} title="Белсенді брондар жоқ" />}
            </TabsContent>
            <TabsContent value="completed" className="space-y-4 focus-visible:outline-none pb-10">
              {completedReservations.length > 0 ? completedReservations.map(r => <Link key={r.id} href={`/booking/${r.restaurant_id}?reservationId=${r.id}`}><ReservationCard reservation={r} /></Link>) : <EmptyState icon={<CheckCircle2 className="w-10 h-10 text-emerald-500/40" />} title="Аяқталған брондар жоқ" />}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}

function EmptyOrders({ t }: { t: any }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center shadow-sm mb-4">
        <Package className="w-10 h-10 text-muted-foreground/40" />
      </div>
      <h2 className="text-xl font-bold mb-2">{t.orders.no_orders}</h2>
      <p className="text-muted-foreground mb-6 max-w-xs mx-auto text-sm">{t.orders.no_orders_desc}</p>
      <Button asChild className="rounded-2xl px-8 font-bold">
        <Link href="/">{t.orders.go_to_menu}</Link>
      </Button>
    </div>
  )
}

function EmptyState({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center shadow-sm mb-4">
        {icon}
      </div>
      <h2 className="text-xl font-bold mb-2 text-muted-foreground/60">{title}</h2>
    </div>
  )
}
