'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Button } from '@/components/ui/button'
import {
    Calendar, Clock, Users, ChefHat, Minus, Plus, Trash2,
    CheckCircle, ArrowLeft, ArrowRight, Loader2, ShoppingCart, Phone, User
} from 'lucide-react'
import {
    getBookingCart, addToBookingCart, updateBookingCartQuantity,
    clearBookingCart, BookingCartItem
} from '@/lib/storage/booking-cart'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface MenuItem {
    id: string
    name_kk: string
    name_ru: string
    price: number
    image_url: string
    is_available: boolean
    category_id: string | null
}

interface Restaurant {
    id: string
    name_kk: string
    name_ru: string
    working_hours: string
}

const STEPS = ['datetime', 'menu', 'confirm'] as const
type Step = typeof STEPS[number]

// Уақыт слоттары
const TIME_SLOTS = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00',
]

function getTodayDate() {
    return new Date().toISOString().split('T')[0]
}

function getNext7Days() {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() + i)
        return d.toISOString().split('T')[0]
    })
}

function formatDateKK(dateStr: string) {
    const d = new Date(dateStr)
    const days = ['Жс', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб']
    const months = ['қаң', 'ақп', 'нау', 'сәу', 'мам', 'мау', 'шіл', 'там', 'қыр', 'қаз', 'қар', 'жел']
    return { day: days[d.getDay()], date: d.getDate(), month: months[d.getMonth()] }
}

export default function BookingPage({ restaurantId }: { restaurantId: string }) {
    const router = useRouter()
    const [step, setStep] = useState<Step>('datetime')

    // Step 1
    const [selectedDate, setSelectedDate] = useState(getTodayDate())
    const [selectedTime, setSelectedTime] = useState('')
    const [guests, setGuests] = useState(2)

    // Step 2
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
    const [bookingCart, setBookingCart] = useState<BookingCartItem[]>([])
    const [loadingMenu, setLoadingMenu] = useState(false)

    // Step 3
    const [customerName, setCustomerName] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)

    // Booking cart sync
    useEffect(() => {
        setBookingCart(getBookingCart())
        const handler = () => setBookingCart(getBookingCart())
        window.addEventListener('bookingCartUpdated', handler)
        return () => window.removeEventListener('bookingCartUpdated', handler)
    }, [])

    // Load restaurant + menu on step 2
    useEffect(() => {
        if (step !== 'menu') return
        setLoadingMenu(true)
        const supabase = createClient()
        Promise.all([
            supabase.from('restaurants').select('id,name_kk,name_ru,working_hours').eq('id', restaurantId).single(),
            supabase.from('menu_items').select('id,name_kk,name_ru,price,image_url,is_available,category_id').eq('restaurant_id', restaurantId).eq('is_available', true).order('sort_order'),
        ]).then(([{ data: rest }, { data: items }]) => {
            setRestaurant(rest)
            setMenuItems(items || [])
            setLoadingMenu(false)
        })
    }, [step, restaurantId])

    function handleAddToCart(item: MenuItem) {
        addToBookingCart({
            id: `bk_${item.id}`,
            menu_item_id: item.id,
            restaurant_id: restaurantId,
            quantity: 1,
            name_kk: item.name_kk,
            name_ru: item.name_ru,
            price: item.price,
            image_url: item.image_url,
        })
    }

    function getCartQty(itemId: string) {
        return bookingCart.find(i => i.menu_item_id === itemId)?.quantity || 0
    }

    function changeQty(itemId: string, delta: number) {
        const item = bookingCart.find(i => i.menu_item_id === itemId)
        if (!item) return
        updateBookingCartQuantity(item.id, item.quantity + delta)
    }

    const bookingTotal = bookingCart.reduce((s, i) => s + i.price * i.quantity, 0)

    async function handleSubmit() {
        if (!customerName.trim() || !customerPhone.trim()) {
            toast.error('Аты-жөн мен телефон нөмірін енгізіңіз')
            return
        }
        setSubmitting(true)
        try {
            const res = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    date: selectedDate,
                    time: selectedTime,
                    guests_count: guests,
                    notes,
                    items: bookingCart.map(i => ({
                        menu_item_id: i.menu_item_id,
                        name_kk: i.name_kk,
                        name_ru: i.name_ru,
                        price: i.price,
                        quantity: i.quantity,
                    })),
                }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Қате')

            clearBookingCart()
            toast.success('Брондалды! Кафе сізбен байланысады 🎉')
            router.push(`/restaurant/${restaurantId}`)
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setSubmitting(false)
        }
    }

    const days = getNext7Days()

    return (
        <div className="flex flex-col min-h-screen pb-20">
            <Header title="Орын брондау" />

            {/* Step indicator */}
            <div className="flex items-center gap-0 px-6 py-4 bg-card border-b border-border">
                {(['datetime', 'menu', 'confirm'] as Step[]).map((s, i) => (
                    <div key={s} className="flex items-center flex-1">
                        <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all',
                            step === s ? 'bg-primary text-primary-foreground scale-110' :
                                STEPS.indexOf(step) > i ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                        )}>
                            {STEPS.indexOf(step) > i ? <CheckCircle className="w-4 h-4" /> : i + 1}
                        </div>
                        {i < 2 && <div className={cn('flex-1 h-0.5 mx-1', STEPS.indexOf(step) > i ? 'bg-primary/40' : 'bg-muted')} />}
                    </div>
                ))}
            </div>

            <main className="flex-1 overflow-auto">

                {/* ═══════════════ ҚАДАМ 1: Күн/Уақыт/Адам ═══════════════ */}
                {step === 'datetime' && (
                    <div className="px-4 py-6 space-y-6">
                        {/* Артқа батырма */}
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground -mb-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Рестораннға қайту
                        </button>
                        {/* Күн */}
                        <div>
                            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                Күнді таңдаңыз
                            </h2>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {days.map(d => {
                                    const { day, date, month } = formatDateKK(d)
                                    const today = d === getTodayDate()
                                    return (
                                        <button
                                            key={d}
                                            onClick={() => setSelectedDate(d)}
                                            className={cn(
                                                'shrink-0 flex flex-col items-center w-14 py-3 rounded-2xl border transition-all',
                                                selectedDate === d
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'bg-card border-border text-foreground'
                                            )}
                                        >
                                            <span className="text-[10px] font-medium opacity-70">{day}</span>
                                            <span className="text-lg font-bold">{date}</span>
                                            <span className="text-[10px] opacity-70">{month}</span>
                                            {today && (
                                                <span className={cn('text-[9px] font-bold mt-0.5', selectedDate === d ? 'text-primary-foreground/70' : 'text-primary')}>
                                                    Бүгін
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Уақыт */}
                        <div>
                            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                Уақытты таңдаңыз
                            </h2>
                            <div className="grid grid-cols-4 gap-2">
                                {TIME_SLOTS.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setSelectedTime(t)}
                                        className={cn(
                                            'py-2.5 rounded-xl text-sm font-medium border transition-all',
                                            selectedTime === t
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-card border-border text-foreground'
                                        )}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Адам саны */}
                        <div>
                            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                Адам саны
                            </h2>
                            <div className="flex items-center gap-4 bg-card rounded-2xl border border-border p-4">
                                <Users className="w-5 h-5 text-primary" />
                                <span className="flex-1 text-sm text-muted-foreground">Қонақтар саны</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setGuests(g => Math.max(1, g - 1))}
                                        className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-all"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-8 text-center text-xl font-bold">{guests}</span>
                                    <button
                                        onClick={() => setGuests(g => Math.min(20, g + 1))}
                                        className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-90 transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <Button
                            className="w-full h-14 text-base font-bold rounded-2xl"
                            disabled={!selectedDate || !selectedTime}
                            onClick={() => setStep('menu')}
                        >
                            Келесі — Тамақ таңдау <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                )}

                {/* ═══════════════ ҚАДАМ 2: Меню (алдын ала тапсырыс) ═══════════════ */}
                {step === 'menu' && (
                    <div className="px-4 py-4">
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => setStep('datetime')} className="flex items-center gap-1 text-sm text-muted-foreground">
                                <ArrowLeft className="w-4 h-4" /> Артқа
                            </button>
                            <h2 className="text-sm font-bold">Тамақты алдын ала тапсырыс</h2>
                            {bookingCart.length > 0 && (
                                <button onClick={() => clearBookingCart()} className="text-xs text-red-500 flex items-center gap-1">
                                    <Trash2 className="w-3 h-3" /> Тазалау
                                </button>
                            )}
                        </div>

                        {/* Алынып тасталуы мүмкін екенін ескерту */}
                        <div className="bg-primary/5 rounded-xl p-3 mb-4 text-xs text-muted-foreground">
                            💡 Тамақты алдын ала тапсырыс етуіңіз міндетті емес — қалауыңыз бойынша
                        </div>

                        {loadingMenu ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {menuItems.map(item => {
                                    const qty = getCartQty(item.id)
                                    return (
                                        <div key={item.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                                            <div className="relative h-28 bg-muted">
                                                {item.image_url ? (
                                                    <Image src={item.image_url} alt={item.name_ru} fill className="object-cover" />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center text-3xl">🍽️</div>
                                                )}
                                            </div>
                                            <div className="p-2.5">
                                                <p className="text-xs font-semibold text-foreground line-clamp-2 mb-1">{item.name_ru}</p>
                                                <p className="text-sm font-bold text-primary">{item.price.toLocaleString()}₸</p>
                                                {qty === 0 ? (
                                                    <button
                                                        onClick={() => handleAddToCart(item)}
                                                        className="w-full mt-2 bg-primary text-primary-foreground text-xs font-semibold py-1.5 rounded-xl active:scale-95 transition-all"
                                                    >
                                                        + Қосу
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center justify-between mt-2">
                                                        <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                                                            <Minus className="w-3.5 h-3.5" />
                                                        </button>
                                                        <span className="text-sm font-bold">{qty}</span>
                                                        <button onClick={() => changeQty(item.id, +1)} className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Cart summary sticky bottom */}
                        <div className="sticky bottom-4">
                            {bookingCart.length > 0 && (
                                <div className="bg-card rounded-2xl border border-primary/20 shadow-lg p-3 mb-3 text-sm">
                                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                                        <ShoppingCart className="w-4 h-4" />
                                        <span>{bookingCart.reduce((s, i) => s + i.quantity, 0)} тағам таңдалды</span>
                                        <span className="ml-auto font-bold text-primary">{bookingTotal.toLocaleString()}₸</span>
                                    </div>
                                </div>
                            )}
                            <Button
                                className="w-full h-14 text-base font-bold rounded-2xl"
                                onClick={() => setStep('confirm')}
                            >
                                Келесі — Растау <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* ═══════════════ ҚАДАМ 3: Растау ═══════════════ */}
                {step === 'confirm' && (
                    <div className="px-4 py-6 space-y-4">
                        <button onClick={() => setStep('menu')} className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                            <ArrowLeft className="w-4 h-4" /> Артқа
                        </button>

                        {/* Брондау қорытындысы */}
                        <div className="bg-primary/5 rounded-2xl p-4 space-y-2">
                            <h2 className="font-bold text-foreground mb-3">Брондау мәліметтері</h2>
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="w-4 h-4 text-primary shrink-0" />
                                <span>{selectedDate}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Clock className="w-4 h-4 text-primary shrink-0" />
                                <span>{selectedTime}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Users className="w-4 h-4 text-primary shrink-0" />
                                <span>{guests} адам</span>
                            </div>
                            {bookingCart.length > 0 && (
                                <div className="flex items-center gap-3 text-sm">
                                    <ChefHat className="w-4 h-4 text-primary shrink-0" />
                                    <span>{bookingCart.length} тағам — {bookingTotal.toLocaleString()}₸</span>
                                </div>
                            )}
                        </div>

                        {/* Байланыс ақпараты */}
                        <div className="space-y-3">
                            <h2 className="font-bold text-foreground">Байланыс ақпараты</h2>

                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Аты-жөніңіз *"
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                    className="w-full bg-card rounded-2xl border border-border pl-10 pr-4 py-3.5 text-sm outline-none focus:border-primary/50 transition-all"
                                />
                            </div>

                            <div className="relative">
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="tel"
                                    placeholder="Телефон нөміріңіз * (+7...)"
                                    value={customerPhone}
                                    onChange={e => setCustomerPhone(e.target.value)}
                                    className="w-full bg-card rounded-2xl border border-border pl-10 pr-4 py-3.5 text-sm outline-none focus:border-primary/50 transition-all"
                                />
                            </div>

                            <textarea
                                placeholder="Қосымша ескертпе (аллергия, арнайы сұраныс...)"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={3}
                                className="w-full bg-card rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all resize-none"
                            />
                        </div>

                        <Button
                            className="w-full h-14 text-base font-bold rounded-2xl mt-4"
                            disabled={submitting || !customerName.trim() || !customerPhone.trim()}
                            onClick={handleSubmit}
                        >
                            {submitting ? (
                                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Жіберілуде...</>
                            ) : (
                                <><CheckCircle className="w-5 h-5 mr-2" /> Брондауды растау</>
                            )}
                        </Button>
                    </div>
                )}
            </main>
        </div>
    )
}
