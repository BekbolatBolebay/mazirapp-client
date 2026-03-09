'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Phone, MapPin, Clock, CheckCircle2, XCircle, MessageCircle, CreditCard, PartyPopper, Bike, AlertTriangle, Lock } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { OrderRating } from '@/components/orders/order-rating'
import { OrderTracker } from '@/components/orders/order-tracker'
import { useI18n } from '@/lib/i18n/i18n-context'
import { toast } from 'sonner'

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

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { t, locale } = useI18n()
  const [order, setOrder] = useState<any>(null)
  const [existingReview, setExistingReview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const handleCancelOrder = async () => {
    setIsCancelling(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (error) {
      toast.error(locale === 'ru' ? 'Ошибка при отмене' : 'Бас тарту кезінде қате шықты')
    } else {
      toast.success(locale === 'ru' ? 'Заказ отменен' : 'Тапсырыс тоқтатылды')
      setOrder((prev: any) => ({ ...prev, status: 'cancelled' }))
    }
    setIsCancelling(false)
    setShowConfirmCancel(false)
  }

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const savedPhone = localStorage.getItem('customer_phone')


      let { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          restaurants!restaurant_id (*),
          order_items (
            *,
            menu_items (*)
          )
        `)
        .eq('id', id)
        .single()

      if (fetchError || !orderData) {
        console.error('Order fetch error:', fetchError?.message || fetchError, fetchError?.details)
        // Check if phone matches as a backup if we have it
        if (savedPhone) {
          console.log('Attempting phone-based fallback...')
        }

        // If we still can't find it, redirect
        if (!orderData) {
          router.push('/orders')
          return
        }
      }

      const { data: reviewData } = await supabase
        .from('reviews')
        .select('*')
        .eq('order_id', id)
        .maybeSingle()

      setOrder(orderData)
      setExistingReview(reviewData)
      setLoading(false)
    }

    fetchData()

    // Real-time listener for this specific order
    const supabase = createClient()
    const channel = supabase
      .channel(`order-details-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        (payload) => {
          console.log('Order update detected in parent:', payload.new.status)
          setOrder((prev: any) => ({ ...prev, ...payload.new }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, router])

  // Confetti trigger
  useEffect(() => {
    if (order?.status === 'completed' || order?.status === 'delivered') {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [order?.status])

  if (loading || !order) {
    return (
      <div className="flex flex-col min-h-screen pb-16">
        <div className="sticky top-0 z-40 w-full border-b border-border bg-background">
          <div className="flex items-center h-14 px-4 max-w-screen-xl mx-auto">
            <Button variant="ghost" size="icon" onClick={() => router.push('/orders')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="ml-2 text-lg font-bold">
              {t.orders.order_id_label} {id.slice(0, 8)}
            </h1>
          </div>
        </div>
        <main className="flex-1 flex items-center justify-center bg-muted/30">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    )
  }

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
            {t.orders.order_id_label}{order.id.slice(0, 8)}
          </h1>
        </div>
      </div>

      <main className="flex-1 overflow-auto bg-muted/30">
        <div className="max-w-screen-xl mx-auto px-4 py-4 space-y-4">
          {(order.status === 'delivered' || order.status === 'completed') && (
            <OrderRating
              orderId={order.id}
              restaurantId={order.restaurant_id}
              customerName={order.customer_name || t.common.client}
              initialRating={existingReview?.rating}
              initialComment={existingReview?.comment}
            />
          )}

          {order.status === 'awaiting_payment' && order.payment_url && (
            <Card className="border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 shadow-xl animate-in zoom-in-95 duration-300 ring-2 ring-amber-400/20">
              <CardContent className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-amber-900 text-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      {locale === 'ru' ? 'Требуется оплата!' : 'Төлем қажет!'}
                    </p>
                    <p className="text-sm text-amber-700 mt-1 font-medium">
                      {t.orders.paymentPendingDesc}
                    </p>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 h-14 text-base font-bold shadow-md hover:shadow-lg transition-all rounded-2xl" asChild>
                  <a href={order.payment_url} target="_blank" rel="noopener noreferrer">
                    <CreditCard className="w-5 h-5 mr-3" />
                    <span>
                      {locale === 'ru'
                        ? `Оплатить — ${Number(order.total_amount).toLocaleString()} ₸`
                        : `Төлем жасау — ${Number(order.total_amount).toLocaleString()} ₸`}
                    </span>
                  </a>
                </Button>
                <p className="text-[10px] text-amber-600 text-center font-medium mt-3 px-4 flex items-center justify-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  {locale === 'ru'
                    ? 'После оплаты заказ автоматически перейдет в статус "Принят"'
                    : 'Төлем орындалған соң, тапсырыс автоматты түрде "Қабылданды" статусына өтеді'}
                </p>
              </CardContent>
            </Card>
          )}

          {order.status !== 'cancelled' && (
            <OrderTracker
              orderId={order.id}
              initialStatus={order.status}
              initialUpdatedAt={order.updated_at}
              initialEstimatedReadyAt={order.estimated_ready_at}
              orderType={order.type as any}
              deliveryFee={Number(order.delivery_fee)}
              totalAmount={Number(order.total_amount)}
            />
          )}

          {/* Support Button */}
          <a
            href={`https://wa.me/${order.restaurants?.whatsapp_number?.replace(/[+\s-()]/g, '') || (order.restaurants?.phone ? order.restaurants.phone.replace(/[+\s-()]/g, '') : '77771234567')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button
              variant="outline"
              className="w-full h-14 rounded-2xl bg-white border-emerald-100 shadow-sm hover:bg-emerald-50 hover:border-emerald-200 transition-all text-emerald-700"
            >
              <MessageCircle className="h-5 w-5 mr-3 text-emerald-500" />
              <span className="font-bold">
                {locale === 'ru' ? 'Поддержка через WhatsApp' : 'WhatsApp арқылы қолдау'}
              </span>
            </Button>
          </a>

          {['pending', 'awaiting_approval', 'awaiting_payment'].includes(order.status) && (
            <div className="space-y-2">
              {!showConfirmCancel ? (
                <Button
                  variant="ghost"
                  className="w-full h-12 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 font-medium transition-all"
                  onClick={() => setShowConfirmCancel(true)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {locale === 'ru' ? 'Отменить заказ' : 'Тапсырыстан бас тарту'}
                </Button>
              ) : (
                <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4 text-center animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-sm">
                  <p className="text-sm font-bold text-destructive mb-3">
                    {locale === 'ru' ? 'Вы уверены, что хотите отменить?' : 'Бас тартуды растайсыз ба?'}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl h-10 text-sm"
                      onClick={() => setShowConfirmCancel(false)}
                      disabled={isCancelling}
                    >
                      {locale === 'ru' ? 'Нет' : 'Жоқ'}
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 rounded-xl h-10 text-sm font-bold shadow-lg shadow-destructive/20"
                      onClick={handleCancelOrder}
                      disabled={isCancelling}
                    >
                      {isCancelling ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                      ) : (
                        locale === 'ru' ? 'Да, отменить' : 'Иә, бас тарту'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {order.status === 'on_the_way' && (
            <Card className="bg-indigo-50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/50 overflow-hidden rounded-3xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center animate-bounce">
                    <Bike className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-base text-indigo-900 dark:text-indigo-300">{t.orders.courierOnWay}</h2>
                    <p className="text-xs text-indigo-700/70 dark:text-indigo-400">
                      {order.one_time_courier_name || t.orders.yourCourier} {t.orders.status.on_the_way || t.orders.outForDelivery}
                    </p>
                  </div>
                </div>
                {order.one_time_courier_phone && (
                  <Button variant="default" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl gap-2 h-12 font-bold" asChild>
                    <a href={`tel:${order.one_time_courier_phone}`}>
                      <Phone className="w-4 h-4" />
                      <span>{t.orders.contactCourier}</span>
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {order.status === 'cancelled' && (
            <Card className="bg-destructive/10 border-destructive rounded-3xl">
              <CardContent className="p-6 text-center">
                <XCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                <h2 className="font-bold text-lg mb-1">{t.orders.orderCancelled}</h2>
                <p className="text-sm text-muted-foreground">
                  {t.orders.orderCancelledDesc}
                </p>
              </CardContent>
            </Card>
          )}

          {(order.status === 'delivered' || order.status === 'completed') && (
            <Card className="bg-emerald-50 border-emerald-100 rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-500">
              <CardContent className="p-6 text-center">
                <PartyPopper className="w-12 h-12 text-emerald-500 mx-auto mb-3 animate-bounce" />
                <h2 className="font-bold text-xl text-emerald-900 mb-1">{t.orders.deliveredToast}</h2>
                <p className="text-sm text-emerald-700/70">
                  {t.orders.deliveredAt} {format(new Date(order.updated_at), 'dd MMM, HH:mm')}
                </p>
              </CardContent>
            </Card>
          )}

          {order.restaurants && (
            <Card className="bg-background/95">
              <CardContent className="p-4">
                <h3 className="font-bold mb-3">{t.orders.pickupAddress}</h3>

                <div className="flex items-start gap-3 mb-3">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {order.restaurants.image_url && (
                      <Image
                        src={order.restaurants.image_url}
                        alt={
                          (locale === 'ru' ? order.restaurants.name_ru : (locale === 'kk' && (order.restaurants as any).name_kk ? (order.restaurants as any).name_kk : order.restaurants.name)) || 'Restaurant'
                        }
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">
                      {locale === 'ru' ? order.restaurants.name_ru : (locale === 'kk' && (order.restaurants as any).name_kk ? (order.restaurants as any).name_kk : order.restaurants.name)}
                    </h4>
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
                      <span className="text-primary font-medium">{t.orders.contactCafe}</span>
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              <h3 className="font-bold mb-3">{t.orders.orderHistory}</h3>

              <div className="space-y-3">
                {order.order_items.map((item: any) => {
                  if (!item.menu_items) return null

                  return (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {item.menu_items.image_url && (
                          <Image
                            src={item.menu_items.image_url}
                            alt={
                              (locale === 'ru' ? item.menu_items.name_ru : (locale === 'kk' && item.menu_items.name_kk ? item.menu_items.name_kk : item.menu_items.name)) || 'Menu item'
                            }
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1">
                          {locale === 'ru' ? item.menu_items.name_ru : (locale === 'kk' && item.menu_items.name_kk ? item.menu_items.name_kk : item.menu_items.name)}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} {t.orders.itemsCountLabel} × {item.price.toFixed(0)}₸
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
                  <span className="text-muted-foreground">{t.cart.food_tab}</span>
                  <span>{(order.total_amount - order.delivery_fee).toFixed(0)}₸</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t.cart.delivery}</span>
                  <span>
                    {order.delivery_fee === 0 ? t.cart.free_label : `${order.delivery_fee.toFixed(0)}₸`}
                  </span>
                </div>

                <Separator className="my-2" />

                <div className="flex items-center justify-between text-lg font-bold">
                  <span>{t.cart.total_label}</span>
                  <span className="text-primary">{order.total_amount.toFixed(0)}₸</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>


      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#f97316', '#22c55e', '#3b82f6', '#eab308', '#ec4899'][Math.floor(Math.random() * 5)],
                width: '10px',
                height: '10px',
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
              }}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes confetti {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti 4s ease-in-out forwards;
        }
      `}</style>
    </div>
  )
}
