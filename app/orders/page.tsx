import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { OrderCard } from '@/components/orders/order-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function OrdersPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      restaurants (*),
      order_items (
        *,
        menu_items (*)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const activeOrders = orders?.filter((order) => 
    ['pending', 'preparing', 'ready', 'delivering'].includes(order.status)
  ) || []

  const completedOrders = orders?.filter((order) => 
    ['delivered', 'cancelled'].includes(order.status)
  ) || []

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <Header title="Менің тапсырыстарым" />

      <main className="flex-1 overflow-auto bg-muted/30">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="all">Барлығы</TabsTrigger>
              <TabsTrigger value="active">
                Дайындалуда {activeOrders.length > 0 && `(${activeOrders.length})`}
              </TabsTrigger>
              <TabsTrigger value="completed">Жеткізілді</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3">
              {orders && orders.length > 0 ? (
                orders.map((order) => (
                  <Link key={order.id} href={`/orders/${order.id}`}>
                    <OrderCard order={order} />
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-6xl mb-4">📦</div>
                  <h2 className="text-xl font-bold mb-2">Тапсырыстар жоқ</h2>
                  <p className="text-muted-foreground mb-4">
                    Сізде әлі тапсырыстар жоқ
                  </p>
                  <Link href="/" className="text-primary font-medium">
                    Мәзірге өту
                  </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-3">
              {activeOrders.length > 0 ? (
                activeOrders.map((order) => (
                  <Link key={order.id} href={`/orders/${order.id}`}>
                    <OrderCard order={order} />
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-6xl mb-4">📦</div>
                  <h2 className="text-xl font-bold mb-2">Белсенді тапсырыстар жоқ</h2>
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-3">
              {completedOrders.length > 0 ? (
                completedOrders.map((order) => (
                  <Link key={order.id} href={`/orders/${order.id}`}>
                    <OrderCard order={order} />
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-6xl mb-4">✅</div>
                  <h2 className="text-xl font-bold mb-2">Аяқталған тапсырыстар жоқ</h2>
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
