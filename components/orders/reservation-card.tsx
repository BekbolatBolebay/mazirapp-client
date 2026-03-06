'use client'

import { Clock, Users, ChevronRight, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Reservation = {
    id: string
    status: string
    date: string
    time: string
    guests_count: number
    total_amount: number
    restaurants: {
        name_kk: string
        name_ru: string
        image_url: string | null
    } | null
}

const statusVariantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    awaiting_payment: 'default',
    accepted: 'default',
    confirmed: 'default',
    completed: 'outline',
    cancelled: 'destructive',
}

export function ReservationCard({ reservation }: { reservation: Reservation }) {
    const { locale, t } = useI18n()

    const statusText = (t.orders.status as any)[reservation.status] || reservation.status
    const variant = statusVariantMap[reservation.status] || 'secondary'

    const restaurantName = locale === 'ru' ? reservation.restaurants?.name_ru : reservation.restaurants?.name_kk

    return (
        <Card className="hover:shadow-md transition-shadow overflow-hidden border-border/50">
            <CardContent className="p-0">
                <div className="flex items-stretch">
                    <div className="w-2 bg-primary/10 shrink-0" />
                    <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="font-bold text-base mb-0.5">
                                    {restaurantName}
                                </h3>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                    ID: {reservation.id.slice(0, 8)}
                                </p>
                            </div>
                            <Badge
                                variant={variant}
                                className={cn(
                                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                    reservation.status === 'awaiting_payment' && "bg-orange-500 hover:bg-orange-600 text-white"
                                )}
                            >
                                {statusText}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-xl px-3 py-2">
                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                <span className="font-medium">{format(new Date(reservation.date), 'dd.MM.yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-xl px-3 py-2">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                <span className="font-medium">{reservation.time.slice(0, 5)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-xl px-3 py-2">
                                <Users className="w-3.5 h-3.5 text-primary" />
                                <span className="font-medium">{reservation.guests_count} {t.cart.guests}</span>
                            </div>
                            {reservation.total_amount > 0 && (
                                <div className="flex items-center gap-2 text-sm text-primary font-bold bg-primary/5 rounded-xl px-3 py-2">
                                    <span className="text-[10px] text-primary/60 font-medium uppercase tracking-tighter">Мәзір:</span>
                                    <span>{reservation.total_amount.toLocaleString()}₸</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-muted-foreground italic">
                                {t.orders.updatedAtLabel}: {format(new Date(), 'HH:mm')}
                            </span>
                            <div className="flex items-center gap-1 text-primary font-bold text-xs">
                                {t.cart.details}
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
