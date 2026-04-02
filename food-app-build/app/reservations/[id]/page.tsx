'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, MapPin, Clock, CheckCircle2, XCircle, MessageCircle, CreditCard, Calendar, Users, Loader2, ChevronRight, Utensils, Info } from 'lucide-react'
import { format } from 'date-fns'
import { getReservationDetails, getReservationReview, subscribeToReservation } from '@/lib/pocketbase/reservations'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { OrderRating } from '@/components/orders/order-rating'
import { useI18n } from '@/lib/i18n/i18n-context'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const statusVariantMap: Record<string, string> = {
    pending: 'bg-muted text-muted-foreground font-bold',
    awaiting_payment: 'bg-amber-500 text-white animate-pulse font-black shadow-lg shadow-amber-500/20',
    confirmed: 'bg-emerald-500 text-white font-black shadow-lg shadow-emerald-500/20',
    preparing: 'bg-indigo-500 text-white font-black shadow-lg shadow-indigo-500/20',
    waiting_arrival: 'bg-purple-500 text-white font-black shadow-lg shadow-purple-500/20',
    completed: 'bg-emerald-600 text-white font-black',
    cancelled: 'bg-destructive text-destructive-foreground font-bold',
}

export default function ReservationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const { t, locale } = useI18n()
    const [reservation, setReservation] = useState<any>(null)
    const [existingReview, setExistingReview] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const data = await getReservationDetails(id)

            if (!data) {
                router.push('/orders')
                return
            }

            setReservation(data)

            // Fetch review if exists
            const reviewData = await getReservationReview(id)
            setExistingReview(reviewData)
            setLoading(false)
        }

        fetchData()

        // Real-time listener using PocketBase
        const unsubscribe = subscribeToReservation(id, (newRecord) => {
            const oldStatus = reservation?.status
            const newStatus = newRecord.status
            
            if (oldStatus && oldStatus !== newStatus) {
                const statusNames: any = {
                    pending: locale === 'kk' ? 'Күтілуде' : 'В ожидании',
                    confirmed: locale === 'kk' ? 'Расталды' : 'Подтверждено',
                    awaiting_payment: locale === 'kk' ? 'Төлем күтілуде' : 'Ожидает оплаты',
                    preparing: locale === 'kk' ? 'Дайындалуда' : 'Готовится',
                    completed: locale === 'kk' ? 'Аяқталды' : 'Завершено',
                    cancelled: locale === 'kk' ? 'Бас тартылды' : 'Отменено'
                }
                toast.success(`${locale === 'kk' ? 'Статус өзгерді:' : 'Статус изменился:'} ${statusNames[newStatus] || newStatus}`)
            }
            
            setReservation((prev: any) => ({ ...prev, ...newRecord }))
        })

        return () => {
            unsubscribe()
        }
    }, [id, router, reservation?.status, locale])

    if (loading || !reservation) {
        return (
            <div className="flex flex-col min-h-screen pb-16">
                <Header title={t.cart.details} id={id} />
                <main className="flex-1 flex items-center justify-center bg-muted/30">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </main>
            </div>
        )
    }

    const restaurantName = locale === 'ru' ? reservation.restaurants?.name_ru : reservation.restaurants?.name_kk
    const statusText = (t.orders.status as any)[reservation.status] || reservation.status

    return (
        <div className="flex flex-col min-h-screen pb-16 bg-muted/30">
            <Header title={t.cart.details} id={id} />

            <main className="flex-1 overflow-auto pb-10">
                <div className="max-w-md mx-auto px-4 py-6 space-y-6">
                    {/* Payment Banner (Top highlight) */}
                    {reservation.status === 'awaiting_payment' && reservation.payment_url && (
                        <Card className="overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-gradient-to-br from-amber-500 to-orange-600 text-white p-1 animate-in fade-in zoom-in duration-500">
                            <div className="bg-black/10 backdrop-blur-sm rounded-[2.4rem] p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                            <CreditCard className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black leading-tight">
                                                {locale === 'kk' ? 'Төлем қажет' : 'Требуется оплата'}
                                            </h3>
                                            <p className="text-xs font-bold text-white/80 uppercase tracking-widest">
                                                {locale === 'kk' ? 'Броньды растау үшін' : 'Для подтверждения брони'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black">{(Number(reservation.total_amount) || 0).toLocaleString()}₸</p>
                                    </div>
                                </div>
                                
                                <Button className="w-full bg-white text-orange-600 h-14 rounded-2xl text-base font-black shadow-xl hover:bg-white/90 transition-all gap-3" asChild>
                                    <a href={reservation.payment_url} target="_blank" rel="noopener noreferrer">
                                        <span>{locale === 'ru' ? 'ОПЛАТИТЬ СЕЙЧАС' : 'ҚАЗІР ТӨЛЕУ'}</span>
                                        <ChevronRight className="w-5 h-5" />
                                    </a>
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Status Card */}
                    <Card className="overflow-hidden border-none shadow-xl rounded-[2.5rem] bg-card text-center p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className={cn(
                            "w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-4",
                            reservation.status === 'cancelled' ? "bg-destructive/10 text-destructive" : (reservation.status === 'awaiting_payment' ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary")
                        )}>
                            {reservation.status === 'cancelled' ? <XCircle className="w-10 h-10" /> : <Calendar className="w-10 h-10" />}
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
                            {statusText}
                        </h2>
                        <p className="text-sm font-medium text-muted-foreground mt-1">
                            {format(new Date(reservation.date), 'dd MMMM yyyy', { locale: locale === 'ru' ? undefined : undefined })} • {reservation.time.slice(0, 5)}
                        </p>
                        
                        <div className="mt-6 flex flex-wrap justify-center gap-2">
                             <Badge className={cn("rounded-full px-4 py-1 font-bold text-[10px] border-none", statusVariantMap[reservation.status])}>
                                {statusText}
                             </Badge>
                             {reservation.payment_status === 'paid' && (
                                <Badge className="rounded-full px-4 py-1 font-bold text-[10px] bg-emerald-500 text-white border-none">
                                    {locale === 'kk' ? 'ТӨЛЕНДІ' : 'ОПЛАЧЕНО'}
                                </Badge>
                             )}
                        </div>
                    </Card>

                    {/* Reservation Details */}
                    <Card className="border-none shadow-lg rounded-[2.5rem] overflow-hidden bg-card">
                        <CardContent className="p-6 space-y-6">
                            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest px-2">{locale === 'kk' ? 'Бронь мәліметтері' : 'Детали брони'}</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <DetailItem 
                                    icon={<Users className="w-4 h-4" />} 
                                    label={t.cart.guests} 
                                    value={`${reservation.guests_count}`} 
                                />
                                <DetailItem 
                                    icon={<Clock className="w-4 h-4" />} 
                                    label={locale === 'kk' ? 'Ұзақтығы' : 'Длительность'} 
                                    value={`${reservation.duration_hours} ${locale === 'kk' ? 'сағат' : 'часа'}`} 
                                />
                                <DetailItem 
                                    icon={<Utensils className="w-4 h-4" />} 
                                    label={locale === 'kk' ? 'Үстел' : 'Стол'} 
                                    value={reservation.tables?.table_number ? `№ ${reservation.tables.table_number}` : (locale === 'kk' ? 'Күтілуде...' : 'Ожидается...')} 
                                />
                                <DetailItem 
                                    icon={<CreditCard className="w-4 h-4" />} 
                                    label={t.cart.payment_method} 
                                    value={reservation.payment_method === 'kaspi' ? 'Kaspi' : (reservation.payment_method === 'freedom' ? 'Карта' : 'Наличные')} 
                                />
                            </div>

                            {reservation.notes && (
                                <div className="mt-4 p-4 rounded-3xl bg-muted/30 text-xs italic text-muted-foreground border border-dashed">
                                    <div className="flex items-center gap-2 mb-1.5 non-italic not-italic font-bold uppercase tracking-tighter text-[10px]">
                                        <Info className="w-3 h-3" /> {t.cart.notes}
                                    </div>
                                    "{reservation.notes}"
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pre-ordered Items */}
                    {reservation.reservation_items?.length > 0 && (
                        <Card className="border-none shadow-lg rounded-[2.5rem] overflow-hidden bg-card">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-center mb-6 px-2">
                                     <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">{locale === 'kk' ? 'Мәзір (алдын ала)' : 'Меню (предзаказ)'}</h3>
                                     <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black">{reservation.reservation_items.length}</span>
                                </div>
                                
                                <div className="space-y-4">
                                    {reservation.reservation_items.map((item: any) => (
                                        <div key={item.id} className="flex justify-between items-start gap-4 p-2">
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-foreground leading-tight">
                                                    {locale === 'ru' ? item.name_ru : item.name_kk}
                                                </p>
                                                <p className="text-[10px] font-black text-primary/60 mt-0.5">
                                                    {item.quantity} × {item.price.toLocaleString()}₸
                                                </p>
                                            </div>
                                            <p className="text-sm font-black text-foreground">
                                                {(item.quantity * item.price).toLocaleString()}₸
                                            </p>
                                        </div>
                                    ))}
                                    
                                    <Separator className="my-2 bg-muted/50" />
                                    
                                    {reservation.booking_fee >= 0 && (
                                    <div className="flex justify-between items-center px-2 py-1 text-primary">
                                        <p className="text-xs font-bold uppercase tracking-tighter">{locale === 'kk' ? 'Брондау ақысы' : 'Плата за бронирование'}</p>
                                        <p className="text-sm font-black">
                                            {Number(reservation.booking_fee) > 0 ? `${Number(reservation.booking_fee).toLocaleString()}₸` : (locale === 'kk' ? 'Тегін' : 'Бесплатно')}
                                        </p>
                                    </div>
                                )}
                                    <Separator className="my-2 bg-muted/50" />
                                    
                                    <div className="flex justify-between items-center px-2 pt-2">
                                        <p className="text-sm font-black uppercase tracking-tighter text-muted-foreground">{t.cart.total}</p>
                                        <p className="text-xl font-black text-primary">{(Number(reservation.total_amount) || 0).toLocaleString()}₸</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Support Card */}
                    <div className="bg-card border border-border shadow-sm rounded-[2rem] p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-0.5">{locale === 'kk' ? 'Қолдау' : 'Поддержка'}</p>
                                <p className="text-sm font-bold">WhatsApp</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-xl w-12 h-12" asChild>
                            <a href={`https://wa.me/${(reservation.restaurants?.whatsapp_number || reservation.restaurants?.phone || '77771234567').replace(/[+\s-()]/g, '')}`} target="_blank">
                                <ChevronRight className="w-6 h-6" />
                            </a>
                        </Button>
                    </div>

                    <div className="h-4" />

                    {reservation.status === 'completed' && (
                        <div className="pt-4">
                            <OrderRating
                                reservationId={reservation.id}
                                restaurantId={reservation.cafe_id}
                                customerName={reservation.customer_name || t.common.client}
                                initialRating={existingReview?.rating}
                                initialComment={existingReview?.comment}
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

function Header({ title, id }: { title: string, id: string }) {
    const router = useRouter()
    return (
        <div className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
            <div className="flex items-center h-14 px-4 max-w-screen-xl mx-auto">
                <Button variant="ghost" size="icon" onClick={() => router.push('/orders')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="ml-2 text-lg font-bold">
                    {title} #{id.slice(0, 8)}
                </h1>
            </div>
        </div>
    )
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="bg-muted/30 p-4 rounded-3xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                {icon}
                {label}
            </div>
            <p className="text-sm font-bold truncate">{value}</p>
        </div>
    )
}

