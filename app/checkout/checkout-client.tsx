'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLocalCart } from '@/hooks/use-local-cart'
import { clearLocalCart } from '@/lib/storage/local-storage'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/i18n-context'
import { CheckCircle2, MapPin, CreditCard, Banknote, ArrowLeft } from 'lucide-react'

export function CheckoutClient() {
    const router = useRouter()
    const cartItems = useLocalCart()
    const { t, locale } = useI18n()
    const [loading, setLoading] = useState(false)
    const [restaurantSettings, setRestaurantSettings] = useState<any>(null)

    // Form state
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [notes, setNotes] = useState('')
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'kaspi' | 'freedom' | null>(null)
    const [orderType, setOrderType] = useState<'delivery' | 'pickup' | 'booking'>('delivery')
    const [tables, setTables] = useState<any[]>([])
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0])
    const [bookingTime, setBookingTime] = useState('19:00')
    const [guestsCount, setGuestsCount] = useState(2)

    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
    const [locating, setLocating] = useState(false)

    const restaurantId = cartItems.length > 0 ? cartItems[0].restaurant_id : null
    const subtotal = cartItems.reduce((sum, item) => sum + item.menu_item.price * item.quantity, 0)
    const deliveryFee = cartItems.length > 0 ? 500 : 0
    const total = subtotal + deliveryFee

    // Fetch restaurant settings and tables
    useEffect(() => {
        if (!restaurantId) return
        const supabase = createClient()

        // Settings
        console.log('[Checkout] Fetching settings for restaurant:', restaurantId)
        supabase
            .from('restaurants')
            .select('accept_cash, accept_kaspi, accept_freedom, is_delivery_enabled, is_pickup_enabled, is_booking_enabled')
            .eq('id', restaurantId)
            .single()
            .then(({ data, error }) => {
                if (error) {
                    console.error('[Checkout] Error fetching restaurant settings:', error)
                    toast.error('Мейрамхана мәліметтерін жүктеу мүмкін болмады')
                    return
                }

                if (data) {
                    console.log('[Checkout] Settings loaded:', data)
                    setRestaurantSettings(data)

                    // Set default payment method if not already set by the user or previous logic
                    // We only do this if it's currently null to avoid overwriting user selection
                    if (data.accept_kaspi) setPaymentMethod('kaspi')
                    else if (data.accept_cash) setPaymentMethod('cash')
                    else if (data.accept_freedom) setPaymentMethod('freedom')
                    else setPaymentMethod(null)

                    if (data.is_delivery_enabled) setOrderType('delivery')
                    else if (data.is_pickup_enabled) setOrderType('pickup')
                    else if (data.is_booking_enabled) setOrderType('booking')
                }
            })

        // Tables
        supabase
            .from('restaurant_tables')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('is_active', true)
            .then(({ data }) => {
                if (data) setTables(data)
            })
    }, [restaurantId])

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast.error(t.cart.geolocation_unsupported)
            return
        }
        setLocating(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
                setLocating(false)
                toast.success(t.cart.coords_detected)
            },
            () => {
                setLocating(false)
                toast.error(t.cart.location_error)
            }
        )
    }

    const handleCheckout = async () => {
        if (!restaurantId || cartItems.length === 0) {
            toast.error(t.cart.cart_empty_toast)
            return
        }

        if (!name || !phone) {
            toast.error(t.cart.enter_name_phone)
            return
        }

        if (orderType === 'delivery' && !address) {
            toast.error(t.cart.enter_address)
            return
        }

        if (!paymentMethod) {
            toast.error(t.cart.select_payment_method || 'Төлем түрін таңдаңыз')
            return
        }

        setLoading(true)
        const supabase = createClient()

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error(t.cart.please_signin)
                router.push('/auth/signin?next=/checkout')
                return
            }

            if (orderType === 'booking') {
                const { data: res, error: resError } = await supabase
                    .from('reservations')
                    .insert({
                        restaurant_id: restaurantId,
                        customer_name: name,
                        customer_phone: phone,
                        date: bookingDate,
                        time: bookingTime,
                        guests_count: guestsCount,
                        table_id: selectedTableId,
                        notes: notes,
                        status: 'pending',
                        total_amount: subtotal
                    })
                    .select()
                    .single()

                if (resError) throw resError

                const resItems = cartItems.map((item) => ({
                    reservation_id: res.id,
                    menu_item_id: item.menu_item_id,
                    name_kk: item.menu_item.name_kk,
                    name_ru: item.menu_item.name_ru,
                    price: item.menu_item.price,
                    quantity: item.quantity,
                }))

                const { error: itemsError } = await supabase
                    .from('reservation_items')
                    .insert(resItems)

                if (itemsError) throw itemsError

                clearLocalCart()
                toast.success(t.cart.booking_confirmed)
                router.push('/')
                return
            }

            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    restaurant_id: restaurantId,
                    cafe_id: restaurantId,
                    status: 'new',
                    total_amount: orderType === 'delivery' ? total : subtotal,
                    delivery_fee: orderType === 'delivery' ? deliveryFee : 0,
                    delivery_address: orderType === 'delivery' ? address : null,
                    latitude: coords?.lat,
                    longitude: coords?.lng,
                    payment_method: paymentMethod,
                    payment_status: 'pending',
                    customer_name: name,
                    customer_phone: phone,
                    notes: notes,
                    type: orderType
                })
                .select()
                .single()

            if (orderError) throw orderError

            const orderItems = cartItems.map((item) => ({
                order_id: order.id,
                menu_item_id: item.menu_item_id,
                quantity: item.quantity,
                price: item.menu_item.price || 0,
            }))

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems)

            if (itemsError) throw itemsError

            if (paymentMethod === 'freedom') {
                const payRes = await fetch('/api/payment/init', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: order.id,
                        amount: orderType === 'delivery' ? total : subtotal,
                        description: `${t.cart.order_number_label} #${order.order_number || order.id.slice(0, 8)}`,
                        customerEmail: user.email,
                        customerPhone: phone
                    })
                })

                const payData = await payRes.json()
                if (payData.redirectUrl) {
                    clearLocalCart()
                    window.location.href = payData.redirectUrl
                    return
                } else {
                    throw new Error(payData.error || t.cart.payment_failed)
                }
            }

            if (typeof window !== 'undefined') {
                localStorage.setItem('customer_phone', phone)
            }

            clearLocalCart()
            toast.success(t.cart.order_confirmed)
            router.push(`/orders/${order.id}`)
        } catch (error: any) {
            toast.error(t.cart.order_error + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (cartItems.length === 0 && !loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <div className="text-6xl mb-4">🛒</div>
                <h2 className="text-xl font-bold mb-2">{t.cart.empty}</h2>
                <Button onClick={() => router.push('/')}>{t.cart.go_home}</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-muted/30 pb-20">
            <Header
                title={t.cart.title}
                backButton={true}
                onBack={() => router.push('/cart')}
            />

            <main className="max-w-screen-md mx-auto px-4 py-6 space-y-6">
                {/* Service Type Selection */}
                <section className="space-y-3">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">{t.cart.service_type}</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: 'delivery', label: t.cart.delivery, icon: '🚚', enabled: restaurantSettings?.is_delivery_enabled !== false },
                            { id: 'pickup', label: t.cart.pickup, icon: '🥡', enabled: restaurantSettings?.is_pickup_enabled !== false },
                            { id: 'booking', label: t.cart.booking, icon: '🪑', enabled: restaurantSettings?.is_booking_enabled !== false },
                        ].filter(s => s.enabled).map((s) => (
                            <button
                                key={s.id}
                                onClick={() => setOrderType(s.id as any)}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-center",
                                    orderType === s.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-transparent text-muted-foreground"
                                )}
                            >
                                <span className="text-2xl">{s.icon}</span>
                                <span className="text-[10px] font-bold">{s.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Contact Details */}
                <section className="space-y-3">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">{t.cart.details}</h3>
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                        <CardContent className="p-5 space-y-4">
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{t.common.fullName}</label>
                                    <Input
                                        placeholder={t.cart.name_placeholder}
                                        className="rounded-xl h-12 bg-muted/50 border-none"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{t.common.phone}</label>
                                    <Input
                                        placeholder="+7 (700) 000-00-00"
                                        className="rounded-xl h-12 bg-muted/50 border-none"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>

                                {orderType === 'delivery' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{t.cart.address}</label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder={t.cart.address_placeholder}
                                                className="rounded-xl h-12 bg-muted/50 border-none flex-1"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                            />
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className={cn("h-12 w-12 rounded-xl shrink-0 transition-all", coords ? "bg-primary/10 text-primary border border-primary/20" : "")}
                                                onClick={handleGetLocation}
                                                disabled={locating}
                                            >
                                                {locating ? "..." : <MapPin className="w-5 h-5" />}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {orderType === 'booking' && (
                                    <div className="space-y-4 pt-2">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{t.cart.date}</label>
                                                <input
                                                    type="date"
                                                    value={bookingDate}
                                                    onChange={e => setBookingDate(e.target.value)}
                                                    className="w-full h-12 bg-muted/50 rounded-xl px-4 text-sm outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{t.cart.time}</label>
                                                <input
                                                    type="time"
                                                    value={bookingTime}
                                                    onChange={e => setBookingTime(e.target.value)}
                                                    className="w-full h-12 bg-muted/50 rounded-xl px-4 text-sm outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{t.cart.guests_count}</label>
                                            <div className="flex items-center gap-4">
                                                <Button
                                                    variant="secondary"
                                                    className="w-10 h-10 rounded-xl"
                                                    onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                                                >−</Button>
                                                <span className="text-lg font-bold w-6 text-center">{guestsCount}</span>
                                                <Button
                                                    variant="secondary"
                                                    className="w-10 h-10 rounded-xl"
                                                    onClick={() => setGuestsCount(Math.min(20, guestsCount + 1))}
                                                >+</Button>
                                            </div>
                                        </div>

                                        {tables.length > 0 && (
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{t.cart.table}</label>
                                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                                    {tables.map(table => (
                                                        <button
                                                            key={table.id}
                                                            onClick={() => setSelectedTableId(table.id)}
                                                            className={cn(
                                                                "shrink-0 min-w-[80px] p-3 rounded-2xl border transition-all text-center",
                                                                selectedTableId === table.id ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-transparent text-muted-foreground"
                                                            )}
                                                        >
                                                            <p className="text-sm font-bold">№{table.table_number}</p>
                                                            <p className="text-[10px] opacity-70">{table.capacity} {t.cart.guests}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-1.5 pt-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">
                                        {orderType === 'booking' ? t.cart.wishes : t.cart.notes}
                                    </label>
                                    <textarea
                                        placeholder={orderType === 'booking' ? t.cart.wishes_placeholder : t.cart.notes_placeholder}
                                        className="w-full min-h-[100px] bg-muted/50 border-none rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Payment Methods */}
                <section className="space-y-3">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">{t.cart.payment_method}</h3>
                    {!restaurantSettings ? (
                        <div className="grid grid-cols-1 gap-3">
                            <div className="h-20 bg-muted/20 animate-pulse rounded-2xl" />
                            <div className="h-20 bg-muted/20 animate-pulse rounded-2xl" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {restaurantSettings.accept_kaspi && (
                                <button
                                    onClick={() => setPaymentMethod('kaspi')}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left shadow-sm bg-card",
                                        paymentMethod === 'kaspi' ? "border-primary ring-1 ring-primary" : "border-transparent"
                                    )}
                                >
                                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-2xl shrink-0">💰</div>
                                    <div className="flex-1">
                                        <p className="font-bold">Kaspi.kz</p>
                                        <p className="text-xs text-muted-foreground">{t.cart.kaspi_desc}</p>
                                    </div>
                                    {paymentMethod === 'kaspi' && <CheckCircle2 className="w-6 h-6 text-primary" />}
                                </button>
                            )}

                            {restaurantSettings.accept_cash && (
                                <button
                                    onClick={() => setPaymentMethod('cash')}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left shadow-sm bg-card",
                                        paymentMethod === 'cash' ? "border-primary ring-1 ring-primary" : "border-transparent"
                                    )}
                                >
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">💵</div>
                                    <div className="flex-1">
                                        <p className="font-bold">{t.cart.cash_label}</p>
                                        <p className="text-xs text-muted-foreground">{t.cart.cash_desc}</p>
                                    </div>
                                    {paymentMethod === 'cash' && <CheckCircle2 className="w-6 h-6 text-primary" />}
                                </button>
                            )}

                            {restaurantSettings.accept_freedom && (
                                <button
                                    onClick={() => setPaymentMethod('freedom')}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left shadow-sm bg-card",
                                        paymentMethod === 'freedom' ? "border-primary ring-1 ring-primary" : "border-transparent"
                                    )}
                                >
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-2xl shrink-0">💳</div>
                                    <div className="flex-1">
                                        <p className="font-bold">Freedom Pay</p>
                                        <p className="text-xs text-muted-foreground">{t.cart.freedom_desc}</p>
                                    </div>
                                    {paymentMethod === 'freedom' && <CheckCircle2 className="w-6 h-6 text-primary" />}
                                </button>
                            )}

                            {!restaurantSettings.accept_kaspi && !restaurantSettings.accept_cash && !restaurantSettings.accept_freedom && (
                                <p className="text-center text-sm text-muted-foreground py-4">Төлем әдістері қолжетімсіз</p>
                            )}
                        </div>
                    )}
                </section>

                {/* Order Summary */}
                <section className="space-y-3">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">{t.cart.foodOrder}</h3>
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                        <CardContent className="p-5">
                            <div className="space-y-3 pb-4 border-b border-muted">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-sm font-bold overflow-hidden">
                                                {item.menu_item.image_url ? (
                                                    <img src={item.menu_item.image_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>🍽️</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{locale === 'ru' ? item.menu_item.name_ru : item.menu_item.name_kk}</p>
                                                <p className="text-[10px] text-muted-foreground">{item.quantity} × {item.menu_item.price}₸</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold">{(item.menu_item.price * item.quantity).toLocaleString()}₸</p>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 space-y-2">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>{t.cart.subtotal}</span>
                                    <span>{subtotal.toLocaleString()}₸</span>
                                </div>
                                {orderType === 'delivery' && (
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>{t.cart.delivery}</span>
                                        <span>{deliveryFee.toLocaleString()}₸</span>
                                    </div>
                                )}
                                <Separator className="my-2 bg-muted" />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>{t.cart.total}</span>
                                    <span className="text-primary">{(orderType === 'delivery' ? total : subtotal).toLocaleString()}₸</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-muted z-50">
                    <Button
                        className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        onClick={handleCheckout}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                <span>{t.cart.sending}</span>
                            </div>
                        ) : (
                            orderType === 'booking' ? (locale === 'kk' ? 'Брондауды растау' : (locale === 'ru' ? 'Подтвердить бронь' : 'Confirm Booking')) : t.cart.checkout
                        )}
                    </Button>
                </div>
            </main>
        </div>
    )
}
