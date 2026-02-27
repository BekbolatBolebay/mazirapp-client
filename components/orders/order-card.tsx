'use client'

import Image from 'next/image'
import { Clock, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Order = {
  id: string
  status: string
  total_amount: number
  created_at: string
  restaurants: {
    name: string
    name_ru: string | null
    image_url: string | null
  } | null
  order_items: Array<{
    quantity: number
    menu_items: {
      name: string
      name_ru: string | null
      image_url: string | null
    } | null
  }>
}

const statusMap: Record<string, { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { text: 'Белсенді статус', variant: 'secondary' },
  preparing: { text: 'Дайындалуда', variant: 'default' },
  ready: { text: 'Дайын', variant: 'default' },
  delivering: { text: 'Дайын', variant: 'default' },
  delivered: { text: 'Жеткізілді', variant: 'outline' },
  cancelled: { text: 'Аяқталды', variant: 'destructive' },
}

export function OrderCard({ order }: { order: Order }) {
  const { locale } = useI18n()
  const status = statusMap[order.status] || statusMap.pending

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {order.order_items[0]?.menu_items?.image_url ? (
              <Image
                src={order.order_items[0].menu_items.image_url}
                alt="Order"
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
                No image
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-base mb-1">
                  Тапсырыс #{order.id.slice(0, 8)}
                </h3>
                {order.restaurants && (
                  <p className="text-sm text-muted-foreground">
                    {locale === 'ru' && order.restaurants.name_ru 
                      ? order.restaurants.name_ru 
                      : order.restaurants.name}
                  </p>
                )}
              </div>
              <Badge variant={status.variant}>{status.text}</Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{format(new Date(order.created_at), 'dd MMM, HH:mm')}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">
                  {order.order_items.reduce((sum, item) => sum + item.quantity, 0)} зат
                </span>
                {' · '}
                <span className="font-bold text-primary">
                  {order.total_amount.toFixed(0)}₸
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
