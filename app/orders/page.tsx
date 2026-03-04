'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { OrderCard } from '@/components/orders/order-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Loader2, Package, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OrdersPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchOrders = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        // Fetch by user_id if logged in
        let userOrders: any[] = []
        if (user) {
          const { data } = await supabase
            .from('orders')
            .select('*, restaurants!restaurant_id (*), order_items (*, menu_items (*))')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
          if (data) userOrders = data
        }

        // Also fetch by phone number from localStorage (Guest mode or backup)
        let phoneOrders: any[] = []
        const savedPhone = localStorage.getItem('customer_phone')
        if (savedPhone) {
          const { data } = await supabase
            .from('orders')
            .select('*, restaurants!restaurant_id (*), order_items (*, menu_items (*))')
            .eq('customer_phone', savedPhone)
            .order('created_at', { ascending: false })
          if (data) phoneOrders = data
        }

        // Merge and deduplicate by ID
        const combined = [...userOrders, ...phoneOrders]
        const unique = Array.from(new Map(combined.map(o => [o.id, o])).values())

        setOrders(unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
      } catch (err) {
        console.error('Fetch orders error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()

    // Real-time subscription for the whole list
    const channel = supabase
      .channel('orders-list-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          console.log('Orders list update detected, re-fetching...')
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const activeOrders = orders.filter((order) =>
    ['pending', 'new', 'accepted', 'preparing', 'ready', 'awaiting_payment', 'on_the_way', 'delivering'].includes(order.status)
  )

  const completedOrders = orders.filter((order) =>
    ['delivered', 'completed', 'cancelled'].includes(order.status)
  )

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen pb-16 bg-muted/30">
        <Header title={t.orders.title} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen pb-16 bg-muted/30">
      <Header title={t.orders.title} />

      <main className="flex-1 overflow-auto">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-6 bg-card border shadow-sm rounded-2xl p-1 h-12">
              <TabsTrigger value="all" className="rounded-xl font-bold">{t.orders.all}</TabsTrigger>
              <TabsTrigger value="active" className="rounded-xl font-bold">
                {t.orders.active} {activeOrders.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full">
                    {activeOrders.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-xl font-bold">{t.orders.completed}</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 focus-visible:outline-none">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <Link key={order.id} href={`/orders/${order.id}`}>
                    <OrderCard order={order} />
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
                  <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center shadow-sm mb-4">
                    <Package className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">{t.orders.no_orders}</h2>
                  <p className="text-muted-foreground mb-6 max-w-xs mx-auto text-sm">
                    {t.orders.no_orders_desc}
                  </p>
                  <Button asChild className="rounded-2xl px-8 font-bold">
                    <Link href="/">
                      {t.orders.go_to_menu}
                    </Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4 focus-visible:outline-none">
              {activeOrders.length > 0 ? (
                activeOrders.map((order) => (
                  <Link key={order.id} href={`/orders/${order.id}`}>
                    <OrderCard order={order} />
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
                  <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center shadow-sm mb-4">
                    <Loader2 className="w-10 h-10 text-primary/40 animate-spin" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">{t.orders.no_active_orders}</h2>
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 focus-visible:outline-none">
              {completedOrders.length > 0 ? (
                completedOrders.map((order) => (
                  <Link key={order.id} href={`/orders/${order.id}`}>
                    <OrderCard order={order} />
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
                  <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center shadow-sm mb-4">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500/40" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">{t.orders.no_completed_orders}</h2>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
