import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Phone, MapPin, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BottomNav } from '@/components/layout/bottom-nav'
import { OrderRating } from '@/components/orders/order-rating'
import { OrderTracker } from '@/components/orders/order-tracker'

const statusMap: Record<string, number> = {
  pending: 0,
  awaiting_payment: 0.5,
  accepted: 1,
  preparing: 2,
  ready: 3,
  on_the_way: 4,
  delivered: 5,
  completed: 5,
  cancelled: -1,
}

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      restaurants (*),
      order_items (
        *,
        menu_items (*)
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!order) {
    notFound()
  }

  const { data: existingReview } = await supabase
    .from('reviews')
    .select('*')
    .eq('order_id', id)
    .maybeSingle()

  const currentStep = statusMap[order.status] || 0

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <div className="sticky top-0 z-40 w-full border-b border-border bg-background">
        <div className="flex items-center h-14 px-4 max-w-screen-xl mx-auto">
          <Link href="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="ml-2 text-lg font-bold">
            Тапсырыс №{order.id.slice(0, 8)}
          </h1>
        </div>
      </div>

      <main className="flex-1 overflow-auto bg-muted/30">
        <div className="max-w-screen-xl mx-auto px-4 py-4 space-y-4">
          {(order.status === 'delivered' || order.status === 'completed') && (
            <OrderRating
              orderId={order.id}
              restaurantId={order.restaurant_id}
              customerName={order.customer_name || 'Клиент'}
              initialRating={existingReview?.rating}
              initialComment={existingReview?.comment}
            />
          )}

          {order.status !== 'cancelled' && (
            <OrderTracker
              orderId={order.id}
              initialStatus={order.status}
              initialUpdatedAt={order.updated_at}
            />
          )}

          {order.status === 'awaiting_payment' && order.payment_url && (
            <Card className="bg-primary/5 border-primary/20 overflow-hidden">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-base">Төлем күтілуде</h2>
                    <p className="text-xs text-muted-foreground">
                      Тапсырысты дайындау үшін Kaspi арқылы төлем жасаңыз
                    </p>
                  </div>
                </div>
                <Button className="w-full bg-[#00A8FF] hover:bg-[#0090DD] text-white font-bold h-12 rounded-xl text-base shadow-lg" asChild>
                  <a href={order.payment_url} target="_blank" rel="noopener noreferrer">
                    Kaspi-мен төлеу
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {order.status === 'on_the_way' && (
            <Card className="bg-indigo-50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/50 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                    <Image
                      src="/courier-icon.png"
                      alt="Courier"
                      width={32}
                      height={32}
                      className="opacity-80"
                      onError={(e) => {
                        (e.target as any).src = "https://cdn-icons-png.flaticon.com/512/2972/2972185.png"
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-base text-indigo-900 dark:text-indigo-300">Курьер жолда</h2>
                    <p className="text-xs text-indigo-700/70 dark:text-indigo-400">
                      {order.one_time_courier_name || 'Сіздің курьеріңіз'} жақында келеді
                    </p>
                  </div>
                </div>
                {order.one_time_courier_phone && (
                  <Button variant="default" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 h-11" asChild>
                    <a href={`tel:${order.one_time_courier_phone}`}>
                      <Phone className="w-4 h-4" />
                      <span>Курьермен байланысу</span>
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) /* on_the_way block ends */}

          {order.status === 'cancelled' && (
            <Card className="bg-destructive/10 border-destructive">
              <CardContent className="p-4 text-center">
                <XCircle className="w-12 h-12 text-destructive mx-auto mb-2" />
                <h2 className="font-bold text-lg mb-1">Тапсырыс тоқтатылды</h2>
                <p className="text-sm text-muted-foreground">
                  Өкінішке орай, тапсырысыңыздан бас тартылды
                </p>
              </CardContent>
            </Card>
          )}

          {(order.status === 'delivered' || order.status === 'completed') && (
            <Card className="bg-accent/10 border-accent">
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="w-12 h-12 text-accent mx-auto mb-2" />
                <h2 className="font-bold text-lg mb-1">Жеткізілді!</h2>
                <p className="text-sm text-muted-foreground">
                  Тапсырысыңыз {format(new Date(order.updated_at), 'dd MMM, HH:mm')} жеткізілді
                </p>
              </CardContent>
            </Card>
          )}

          {order.restaurants && (
            <Card className="bg-background/95">
              <CardContent className="p-4">
                <h3 className="font-bold mb-3">Алу мекенжайы</h3>

                <div className="flex items-start gap-3 mb-3">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {order.restaurants.image_url && (
                      <Image
                        src={order.restaurants.image_url}
                        alt={order.restaurants.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{order.restaurants.name}</h4>
                    {order.restaurants.address && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{order.restaurants.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {order.restaurants.phone && (
                  <Button variant="outline" className="w-full justify-center gap-2" asChild>
                    <a href={`tel:${order.restaurants.phone}`}>
                      <Phone className="w-4 h-4 text-primary" />
                      <span className="text-primary font-medium">Кафемен байланысу</span>
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              <h3 className="font-bold mb-3">Тапсырыс тарихы</h3>

              <div className="space-y-3">
                {order.order_items.map((item: any) => {
                  if (!item.menu_items) return null

                  return (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {item.menu_items.image_url && (
                          <Image
                            src={item.menu_items.image_url}
                            alt={item.menu_items.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1">
                          {item.menu_items.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} зат × {item.price.toFixed(0)}₸
                        </p>
                      </div>

                      <div className="font-bold">
                        {(item.quantity * item.price).toFixed(0)}₸
                      </div>
                    </div>
                  )
                })}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Тауарлар</span>
                  <span>{(order.total_amount - order.delivery_fee).toFixed(0)}₸</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Жеткізу</span>
                  <span>
                    {order.delivery_fee === 0 ? 'Тегін' : `${order.delivery_fee.toFixed(0)}₸`}
                  </span>
                </div>

                <Separator className="my-2" />

                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Барлығы</span>
                  <span className="text-primary">{order.total_amount.toFixed(0)}₸</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
