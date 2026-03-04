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
import { CheckCircle2, MapPin, CreditCard, Banknote, ArrowLeft } from 'lucide-react'

export function CheckoutClient() {
    const router = useRouter()
    const cartItems = useLocalCart()
    const [loading, setLoading] = useState(false)
    const [restaurantSettings, setRestaurantSettings] = useState<any>(null)

    // Form state
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [notes, setNotes] = useState('')
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'kaspi' | 'freedom'>('kaspi')
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
    const [locating, setLocating] = useState(false)

    const restaurantId = cartItems.length > 0 ? cartItems[0].restaurant_id : null
    const subtotal = cartItems.reduce((sum, item) => sum + item.menu_item.price * item.quantity, 0)
    const deliveryFee = cartItems.length > 0 ? 500 : 0
    const total = subtotal + deliveryFee

    // Fetch restaurant settings
    useEffect(() => {
        if (!restaurantId) return
        const supabase = createClient()
        supabase
            .from('restaurants')
            .select('accept_cash, accept_kaspi, accept_freedom')
            .eq('id', restaurantId)
            .single()
            .then(({ data }) => {
                if (data) {
                    setRestaurantSettings(data)
                    if (data.accept_kaspi) setPaymentMethod('kaspi')
                    else if (data.accept_cash) setPaymentMethod('cash')
                    else if (data.accept_freedom) setPaymentMethod('freedom')
                }
            })
    }, [restaurantId])

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Браузеріңіз геолокацияны қолдамайды')
            return
        }
        setLocating(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
                setLocating(false)
                toast.success('Координаталар анықталды')
            },
            () => {
                setLocating(false)
                toast.error('Орынды анықтау мүмкін болмады. Мекенжайды қолмен енгізіңіз.')
            }
        )
    }

    const handleCheckout = async () => {
        if (!restaurantId || cartItems.length === 0) {
            toast.error('Себет бос')
            return
        }

        if (!name || !phone || !address) {
            toast.error('Барлық өрістерді толтырыңыз')
            return
        }

        setLoading(true)
        const supabase = createClient()

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Жүйеге кіріңіз')
                router.push('/auth/signin')
                return
            }

            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    restaurant_id: restaurantId,
                    cafe_id: restaurantId,
                    status: 'new',
                    total_amount: total,
                    delivery_fee: deliveryFee,
                    delivery_address: address,
                    latitude: coords?.lat,
                    longitude: coords?.lng,
                    payment_method: paymentMethod,
                    payment_status: 'pending',
                    customer_name: name,
                    customer_phone: phone,
                    notes: notes,
                    type: 'delivery'
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
                        amount: total,
                        description: `Тапсырыс #${order.order_number || order.id.slice(0, 8)}`,
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
                    throw new Error(payData.error || 'Төлемді бастау мүмкін болмады')
                }
            }

            clearLocalCart()
            toast.success('Тапсырыс қабылданды!')
            router.push(`/orders/${order.id}`)
        } catch (error: any) {
            toast.error('Қате орын алды: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (cartItems.length === 0 && !loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <div className="text-6xl mb-4">🛒</div>
                <h2 className="text-xl font-bold mb-2">Себет бос</h2>
                <Button onClick={() => router.push('/')}>Басты бетке өту</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-muted/30 pb-20">
            <Header
                title="Төлем жасау"
                backButton={true}
                onBack={() => router.push('/cart')}
            />

            <main className="max-w-screen-md mx-auto px-4 py-6 space-y-6">
                {/* Мекенжай блогы */}
                <section className="space-y-3">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">Жеткізу мекенжайы</h3>
                    <Card className="border-none shadow-sm rounded-2xl">
                        <CardContent className="p-4 space-y-4">
                            <Input
                                placeholder="Атыңыз"
                                className="rounded-xl h-12 bg-muted/50 border-none"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <Input
                                placeholder="Телефон нөмірі"
                                className="rounded-xl h-12 bg-muted/50 border-none"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Мекенжай (көше, үй, пәтер)"
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
                            <textarea
                                placeholder="Түсініктеме (домофон коды, қабат...)"
                                className="w-full min-h-[100px] bg-muted/50 border-none rounded-xl px-4 py-3 text-sm outline-none resize-none"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </CardContent>
                    </Card>
                </section>

                {/* Төлем әдістері */}
                <section className="space-y-3">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">Төлем түрі</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {(!restaurantSettings || restaurantSettings.accept_kaspi) && (
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
                                    <p className="text-xs text-muted-foreground">Төлем сілтемесі жіберіледі</p>
                                </div>
                                {paymentMethod === 'kaspi' && <CheckCircle2 className="w-6 h-6 text-primary" />}
                            </button>
                        )}

                        {(!restaurantSettings || restaurantSettings.accept_cash) && (
                            <button
                                onClick={() => setPaymentMethod('cash')}
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left shadow-sm bg-card",
                                    paymentMethod === 'cash' ? "border-primary ring-1 ring-primary" : "border-transparent"
                                )}
                            >
                                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-2xl shrink-0">💵</div>
                                <div className="flex-1">
                                    <p className="font-bold">Қолма-қол ақша</p>
                                    <p className="text-xs text-muted-foreground">Курьерге немесе кассада</p>
                                </div>
                                {paymentMethod === 'cash' && <CheckCircle2 className="w-6 h-6 text-primary" />}
                            </button>
                        )}

                        {(!restaurantSettings || restaurantSettings.accept_freedom) && (
                            <button
                                onClick={() => setPaymentMethod('freedom')}
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left shadow-sm bg-card",
                                    paymentMethod === 'freedom' ? "border-primary ring-1 ring-primary" : "border-transparent"
                                )}
                            >
                                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-2xl shrink-0">💳</div>
                                <div className="flex-1">
                                    <p className="font-bold">Freedom Pay</p>
                                    <p className="text-xs text-muted-foreground">Онлайн картамен төлеу</p>
                                </div>
                                {paymentMethod === 'freedom' && <CheckCircle2 className="w-6 h-6 text-primary" />}
                            </button>
                        )}
                    </div>
                </section>

                {/* Қорытынды */}
                <section className="space-y-3">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">Жиынтық</h3>
                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                        <CardContent className="p-4 space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Тауарлар сомасы</span>
                                <span className="font-semibold">{subtotal.toLocaleString()}₸</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Жеткізу</span>
                                <span className="font-semibold">{deliveryFee.toLocaleString()}₸</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                                <span>Барлығы</span>
                                <span className="text-primary">{total.toLocaleString()}₸</span>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <div className="pt-4">
                    <Button
                        className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20"
                        size="lg"
                        onClick={handleCheckout}
                        disabled={loading}
                    >
                        {loading ? 'Жөнелтілуде...' : `${total.toLocaleString()}₸ Төлеу`}
                    </Button>
                </div>
            </main>
        </div>
    )
}
