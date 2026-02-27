import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Phone, MapPin, Clock, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BottomNav } from '@/components/layout/bottom-nav'

const statusSteps = [
  { key: 'pending', label: 'Қабылданды', icon: CheckCircle2 },
  { key: 'preparing', label: 'Дайындалуда', icon: Clock },
  { key: 'ready', label: 'Дайын', icon: CheckCircle2 },
  { key: 'delivering', label: 'Дайын', icon: Clock },
]

const statusMap: Record<string, number> = {
  pending: 0,
  preparing: 1,
  ready: 2,
  delivering: 3,
  delivered: 4,
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
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-0">
              <CardContent className="p-4">
                <h2 className="font-bold text-lg mb-1">Дайын</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Тапсырыс дайын, дүкеннен алуға болады
                </p>

                <div className="space-y-3">
                  {statusSteps.map((step, index) => {
                    const isCompleted = index <= currentStep
                    const Icon = step.icon

                    return (
                      <div key={step.key} className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCompleted
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${
                              isCompleted ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {step.label}
                          </p>
                          {index === currentStep && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(order.updated_at), 'HH:mm')}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {order.status === 'delivered' && (
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
                {order.order_items.map((item) => {
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
