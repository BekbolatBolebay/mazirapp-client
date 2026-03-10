'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { notifyAdmin } from '@/lib/actions'
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
import { useAuth } from '@/lib/auth/auth-context'
import { CheckCircle2, MapPin, CreditCard, Banknote, ArrowLeft, Map as MapIcon, Navigation, Loader2, Truck, ShoppingBag, Users, Wallet, Utensils, ShoppingCart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { CheckoutAuth } from '@/components/checkout/checkout-auth'

const MapPicker = dynamic(() => import('@/components/checkout/map-picker').then(mod => mod.MapPicker), {
    ssr: false,
    loading: () => <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
})

// Haversine formula to calculate distance between two coordinates in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371 // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

export function CheckoutClient() {
    const router = useRouter()
    const cartItems = useLocalCart()
    const { t, locale } = useI18n()
    const { user: authUser, loading: authLoading } = useAuth()
    const [checkoutLoading, setCheckoutLoading] = useState(false)
    const [restaurantSettings, setRestaurantSettings] = useState<any>(null)
    const [step, setStep] = useState<'auth' | 'form' | 'summary'>('auth')

    // Redirect to form/summary if already logged in or after login
    useEffect(() => {
        if (authUser && step === 'auth') {
            setStep('form')
        }
    }, [authUser, step])

    // Form state
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [notes, setNotes] = useState('')
    const [paymentMethod, setPaymentMethod] = useState<'kaspi' | 'freedom' | 'cash' | null>(null)

    // Load persisted payment method
    useEffect(() => {
        const persisted = localStorage.getItem('last_payment_method')
        if (persisted === 'kaspi' || persisted === 'freedom') {
            setPaymentMethod(persisted)
        }
    }, [])

    // Persist payment method
    const handleSetPaymentMethod = (method: 'kaspi' | 'freedom' | 'cash') => {
        setPaymentMethod(method)
        localStorage.setItem('last_payment_method', method)
    }
    const [orderType, setOrderType] = useState<'delivery' | 'pickup' | 'booking'>('delivery')
    const [tables, setTables] = useState<any[]>([])
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0])
    const [bookingTime, setBookingTime] = useState('19:00')
    const [guestsCount, setGuestsCount] = useState(2)

    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
    const [locating, setLocating] = useState(false)
    const [mapOpen, setMapOpen] = useState(false)
    const [distance, setDistance] = useState<number | null>(null)
    const [calculatedFee, setCalculatedFee] = useState<number>(0)

    const restaurantId = cartItems.length > 0 ? cartItems[0].restaurant_id : null
    const subtotal = cartItems.reduce((sum, item) => sum + item.menu_item.price * item.quantity, 0)

    // Calculate delivery fee
    useEffect(() => {
        if (orderType === 'delivery' && coords && restaurantSettings) {
            const resLat = restaurantSettings.latitude
            const resLng = restaurantSettings.longitude

            if (resLat && resLng) {
                const dist = calculateDistance(resLat, resLng, coords.lat, coords.lng)
                setDistance(dist)

                const baseFee = restaurantSettings.base_delivery_fee || 0
                const perKmFee = restaurantSettings.delivery_fee_per_km || 0
                const fee = Math.round(baseFee + (dist * perKmFee))
                setCalculatedFee(fee)
            } else {
                setCalculatedFee(restaurantSettings.delivery_fee || 0)
            }
        } else if (orderType === 'delivery' && restaurantSettings) {
            setCalculatedFee(restaurantSettings.delivery_fee || 0)
        } else {
            setCalculatedFee(0)
        }
    }, [orderType, coords, restaurantSettings])

    // Re-validate and reset payment method when orderType changes
    useEffect(() => {
        if (!restaurantSettings) return

        const isBooking = orderType === 'booking'
        const canKaspi = isBooking ? restaurantSettings.booking_accept_kaspi : restaurantSettings.accept_kaspi
        const canFreedom = isBooking ? restaurantSettings.booking_accept_freedom : restaurantSettings.accept_freedom
        const canCash = isBooking ? restaurantSettings.booking_accept_cash : restaurantSettings.accept_cash

        setPaymentMethod(prev => {
            if (prev === 'kaspi' && canKaspi) return 'kaspi'
            if (prev === 'freedom' && canFreedom) return 'freedom'
            if (prev === 'cash' && canCash) return 'cash'

            // Auto-select first available
            if (canKaspi) return 'kaspi'
            if (canFreedom) return 'freedom'
            if (canCash) return 'cash'
            return null
        })
    }, [orderType, restaurantSettings])

    const total = subtotal + calculatedFee

    // Fetch restaurant settings and tables
    useEffect(() => {
        if (!restaurantId) return
        const supabase = createClient()

        // Settings
        const fetchSettings = () => {
            supabase
                .from('restaurants')
                .select('*')
                .eq('id', restaurantId)
                .single()
                .then(({ data, error }) => {
                    if (error) {
                        console.error('[Checkout] Error fetching restaurant settings:', error)
                        return
                    }

                    if (data) {
                        setRestaurantSettings(data)

                        // Set default payment method if none selected correctly
                        setPaymentMethod(prev => {
                            if (prev) return prev
                            const persisted = localStorage.getItem('last_payment_method')
                            const isBooking = orderType === 'booking'
                            const canKaspi = isBooking ? data.booking_accept_kaspi : data.accept_kaspi
                            const canFreedom = isBooking ? data.booking_accept_freedom : data.accept_freedom
                            const canCash = isBooking ? data.booking_accept_cash : data.accept_cash

                            if (persisted === 'kaspi' && canKaspi) return 'kaspi'
                            if (persisted === 'freedom' && canFreedom) return 'freedom'
                            if (persisted === 'cash' && canCash) return 'cash'

                            if (canKaspi) return 'kaspi'
                            if (canFreedom) return 'freedom'
                            if (canCash) return 'cash'
                            return null
                        })

                        if (data.is_delivery_enabled) setOrderType(prev => prev || 'delivery')
                        else if (data.is_pickup_enabled) setOrderType(prev => prev || 'pickup')
                        else if (data.is_booking_enabled) setOrderType(prev => prev || 'booking')
                    }
                })
        }

        fetchSettings()

        // Real-time updates for restaurant settings
        const channel = supabase
            .channel(`restaurant-settings-${restaurantId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'restaurants',
                filter: `id=eq.${restaurantId}`
            }, fetchSettings)
            .subscribe()

        // Tables
        supabase
            .from('restaurant_tables')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('is_active', true)
            .then(({ data }) => {
                if (data) setTables(data)
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [restaurantId])

    useEffect(() => {
        if (orderType === 'delivery' && !coords && !locating) {
            handleGetLocation()
        }
    }, [orderType, coords, locating])

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

    const handleContinueToSummary = () => {
        if (!name || !phone) {
            toast.error(t.cart.enter_name_phone)
            return
        }

        if (orderType === 'delivery') {
            if (!address || !coords) {
                toast.error(locale === 'kk' ? 'Мекен-жайды картадан таңдаңыз' : 'Выберите адрес на карте')
                return
            }
            if (restaurantSettings && !restaurantSettings.latitude) {
                toast.error(locale === 'kk' ? 'Кафе орналасқан жері белгісіз. Жеткізу мүмкін емес.' : 'Местоположение кафе не определено. Доставка невозможна.')
                return
            }
        }

        if (!paymentMethod) {
            toast.error(t.cart.select_payment_method)
            return
        }

        setStep('summary')
        window.scrollTo(0, 0)
    }

    const handleCheckout = async () => {
        setCheckoutLoading(true)
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

                // Notify Admin via Push
                await notifyAdmin(res, 'booking', restaurantId || undefined)

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
                    status: paymentMethod === 'freedom' ? 'awaiting_payment' : 'new',
                    total_amount: orderType === 'delivery' ? total : subtotal,
                    delivery_fee: orderType === 'delivery' ? calculatedFee : 0,
                    delivery_address: orderType === 'delivery' ? address : null,
                    latitude: coords?.lat,
                    longitude: coords?.lng,
                    payment_method: paymentMethod,
                    payment_status: 'pending',
                    customer_name: name,
                    customer_phone: phone,
                    notes: notes,
                    type: orderType,
                    items_count: cartItems.length
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

            // Notify Admin via Push
            await notifyAdmin(order, 'order', restaurantId || undefined)

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
            setCheckoutLoading(false)
        }
    }

    if (cartItems.length === 0 && !checkoutLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <div className="text-muted-foreground/20 mb-6">
                    <ShoppingCart className="w-20 h-20" />
                </div>
                <h2 className="text-xl font-bold mb-2">{t.cart.empty}</h2>
                <Button onClick={() => router.push('/')}>{t.cart.go_home}</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-muted/30 pb-20">
            <AnimatePresence>
                {checkoutLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-6 text-center"
                    >
                        <div className="w-20 h-20 relative mb-6">
                            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">
                            {locale === 'kk' ? 'Төлем бетіне өту...' : 'Переходим к оплате...'}
                        </h2>
                        <p className="text-sm text-muted-foreground italic">
                            {locale === 'kk' ? 'Бұл бірнеше секунд алуы мүмкін' : 'Это может занять несколько секунд'}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <Header
                title={step === 'summary' ? t.cart.summary_title : t.cart.title}
                backButton={true}
                onBack={() => step === 'summary' ? setStep('form') : router.push('/cart')}
            />

            <main className="max-w-screen-md mx-auto px-4 py-6 space-y-6 pb-32">
                {step === 'auth' ? (
                    <CheckoutAuth onLogin={() => setStep('form')} />
                ) : step === 'form' ? (
                    <>
                        {/* Service Type Selection */}
                        <section className="space-y-3">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">{t.cart.service_type}</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'delivery', label: t.cart.delivery, icon: <Truck className="w-6 h-6" />, enabled: restaurantSettings?.is_delivery_enabled !== false },
                                    { id: 'pickup', label: t.cart.pickup, icon: <ShoppingBag className="w-6 h-6" />, enabled: restaurantSettings?.is_pickup_enabled !== false },
                                    { id: 'booking', label: t.cart.booking, icon: <Users className="w-6 h-6" />, enabled: restaurantSettings?.is_booking_enabled !== false },
                                ].filter(s => s.enabled).map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => setOrderType(s.id as any)}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-center",
                                            orderType === s.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-transparent text-muted-foreground"
                                        )}
                                    >
                                        {s.icon}
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
                                                className="rounded-xl h-12 bg-muted/50 border-none px-4"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{t.common.phone}</label>
                                            <Input
                                                placeholder="+7 (700) 000-00-00"
                                                className="rounded-xl h-12 bg-muted/50 border-none px-4"
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
                                                        className="rounded-xl h-12 bg-muted/50 border-none flex-1 px-4"
                                                        value={address}
                                                        onChange={(e) => setAddress(e.target.value)}
                                                    />
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        className={cn("h-12 w-12 rounded-xl shrink-0 transition-all", coords ? "bg-primary/10 text-primary border border-primary/20" : "")}
                                                        onClick={() => setMapOpen(true)}
                                                    >
                                                        <MapIcon className="w-5 h-5" />
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

                        {/* Payment Methods at bottom of Step 1 */}
                        <section className="space-y-3">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">{t.cart.payment_method}</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {((orderType === 'booking' ? restaurantSettings?.booking_accept_kaspi : restaurantSettings?.accept_kaspi)) && (
                                    <button
                                        onClick={() => handleSetPaymentMethod('kaspi')}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-2xl border transition-all text-left bg-card",
                                            paymentMethod === 'kaspi' ? "border-primary ring-1 ring-primary" : "border-transparent"
                                        )}
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 shrink-0">
                                            <Wallet className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold">Kaspi.kz</p>
                                        </div>
                                        {paymentMethod === 'kaspi' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                    </button>
                                )}
                                {((orderType === 'booking' ? restaurantSettings?.booking_accept_freedom : restaurantSettings?.accept_freedom)) && (
                                    <button
                                        onClick={() => handleSetPaymentMethod('freedom')}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-2xl border transition-all text-left bg-card",
                                            paymentMethod === 'freedom' ? "border-primary ring-1 ring-primary" : "border-transparent"
                                        )}
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl shrink-0">💳</div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold">{locale === 'kk' ? 'Картамен төлеу' : 'Оплата картой'}</p>
                                            <p className="text-[10px] text-muted-foreground">Visa, MasterCard, Maestro</p>
                                        </div>
                                        {paymentMethod === 'freedom' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                    </button>
                                )}
                                {((orderType === 'booking' ? restaurantSettings?.booking_accept_cash : restaurantSettings?.accept_cash)) && (
                                    <button
                                        onClick={() => handleSetPaymentMethod('cash')}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-2xl border transition-all text-left bg-card",
                                            paymentMethod === 'cash' ? "border-primary ring-1 ring-primary" : "border-transparent"
                                        )}
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-xl shrink-0">💵</div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold">{locale === 'kk' ? 'Қолма-қол' : 'Наличными'}</p>
                                        </div>
                                        {paymentMethod === 'cash' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                    </button>
                                )}
                            </div>
                        </section>
                    </>
                ) : (
                    /* Step 2: Summary */
                    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                        <section className="text-center py-4">
                            <h2 className="text-2xl font-black text-foreground">{t.cart.review_details}</h2>
                            <p className="text-sm text-muted-foreground">{t.cart.summary_title}</p>
                        </section>

                        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-background">
                            <CardContent className="p-8 space-y-8">
                                {/* Order Items Summary */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b pb-4">
                                        <h4 className="font-bold text-lg">{t.cart.foodOrder}</h4>
                                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                                            {cartItems.length} {t.cart.items_label}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {cartItems.map((item) => (
                                            <div key={item.id} className="flex justify-between items-center bg-muted/30 p-3 rounded-2xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center font-bold overflow-hidden shadow-sm">
                                                        {item.menu_item.image_url ? (
                                                            <img src={item.menu_item.image_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Utensils className="w-5 h-5 text-muted-foreground/30" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold line-clamp-1">{locale === 'ru' ? item.menu_item.name_ru : item.menu_item.name_kk}</p>
                                                        <p className="text-[10px] text-muted-foreground">{item.quantity} × {item.menu_item.price}₸</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-black text-foreground">{(item.menu_item.price * item.quantity).toLocaleString()}₸</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Separator className="bg-muted/50" />

                                {/* Delivery & Details Summary */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-lg">{t.cart.details}</h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="flex items-start gap-4 p-4 rounded-3xl bg-muted/20">
                                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <MapPin className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t.cart.address}</p>
                                                <p className="text-sm font-bold leading-tight">{orderType === 'delivery' ? address : t.cart.pickup}</p>
                                                {distance && orderType === 'delivery' && (
                                                    <p className="text-[10px] font-medium text-primary mt-1">~{distance.toFixed(1)} км</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-4 rounded-3xl bg-muted/20">
                                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <CreditCard className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t.cart.payment_method}</p>
                                                <p className="text-sm font-bold">
                                                    {paymentMethod === 'kaspi' ? 'Kaspi.kz' : (paymentMethod === 'freedom' ? (locale === 'kk' ? 'Картамен төлеу' : 'Оплата картой') : '')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Breakdown */}
                                <div className="bg-primary/5 rounded-[2rem] p-6 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-medium">{t.cart.subtotal}</span>
                                        <span className="font-bold">{subtotal.toLocaleString()} ₸</span>
                                    </div>
                                    {orderType === 'delivery' && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-medium">{t.cart.delivery}</span>
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold">
                                                    {!coords ? (
                                                        <span className="text-rose-500 animate-pulse text-[10px] uppercase font-black">
                                                            {locale === 'kk' ? 'Мекен-жай таңдалмаған' : 'Адрес не выбран'}
                                                        </span>
                                                    ) : (restaurantSettings && !restaurantSettings.latitude) ? (
                                                        <span className="text-rose-500 animate-pulse text-[10px] uppercase font-black">
                                                            {locale === 'kk' ? 'Есептеледі...' : 'Рассчитывается...'}
                                                        </span>
                                                    ) : calculatedFee === 0 ? (
                                                        <span className="text-green-500 font-black uppercase tracking-tighter text-xs">{t.cart.free_label}</span>
                                                    ) : (
                                                        `${calculatedFee.toLocaleString()} ₸`
                                                    )}
                                                </span>
                                                {distance !== null && distance > 0 && coords && (
                                                    <span className="text-[10px] text-muted-foreground font-medium italic">
                                                        ~{distance.toFixed(1)} {locale === 'kk' ? 'км' : 'км'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <Separator className="bg-primary/10 my-1" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-black text-foreground">{t.cart.total}</span>
                                        <span className="text-2xl font-black text-primary">{(orderType === 'delivery' ? total : subtotal).toLocaleString()} ₸</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <button
                            onClick={() => setStep('form')}
                            className="w-full py-4 text-sm font-bold text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t.cart.back_to_edit}
                        </button>
                    </div>
                )}

                {step !== 'auth' && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-muted z-50">
                        <Button
                            className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            onClick={step === 'form' ? handleContinueToSummary : handleCheckout}
                            disabled={checkoutLoading}
                        >
                            {checkoutLoading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>{t.cart.sending}</span>
                                </div>
                            ) : (
                                step === 'form' ? t.cart.continue_label : t.cart.confirm_and_pay
                            )}
                        </Button>
                    </div>
                )}

                <MapPicker
                    open={mapOpen}
                    onOpenChange={setMapOpen}
                    initialCoords={coords}
                    onSelect={(lat: number, lng: number, addr?: string) => {
                        setCoords({ lat, lng })
                        if (addr) setAddress(addr)
                    }}
                />
            </main>
        </div >
    )
}
