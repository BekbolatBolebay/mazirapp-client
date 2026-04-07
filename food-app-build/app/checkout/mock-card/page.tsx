'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CreditCard, Lock, ArrowLeft, CheckCircle2, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n/i18n-context'

export default function MockCardPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const orderId = searchParams.get('orderId')
    const reservationId = searchParams.get('reservationId')
    const amount = searchParams.get('amount')
    const { locale } = useI18n()

    const [cardNumber, setCardNumber] = useState('')
    const [expiry, setExpiry] = useState('')
    const [cvv, setCvv] = useState('')
    const [name, setName] = useState('')
    const [isPaying, setIsPaying] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
        const matches = v.match(/\d{4,16}/g)
        const match = matches && matches[0] || ''
        const parts = []
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4))
        }
        if (parts.length) return parts.join(' ')
        return value
    }

    const handlePay = async () => {
        if (cardNumber.length < 16 || expiry.length < 5 || cvv.length < 3 || !name) {
            return
        }
        setIsPaying(true)

        // Simulate bank processing time
        setTimeout(async () => {
            try {
                // Determine what we're updating
                const targetId = orderId || reservationId
                const targetTable = orderId ? 'orders' : 'reservations'

                if (!targetId) {
                    toast.error('ID is missing')
                    setIsPaying(false)
                    return
                }

                const res = await fetch('/api/payment/mock-finalize', {
                    method: 'POST',
                    body: JSON.stringify({ targetTable, targetId }),
                    headers: { 'Content-Type': 'application/json' }
                })
                const data = await res.json()

                if (data.error) {
                    console.error('Update error:', data.error)
                    toast.error('База мәліметтерін жаңарту қатесі')
                    setIsPaying(false)
                    return
                }

                // Redirect logic
                let redirectUrl = orderId ? `/orders/${orderId}?status=success&mock=true` : '/';
                if (reservationId && data.cafe_id) {
                    redirectUrl = `/booking/${data.cafe_id}?step=status&reservationId=${reservationId}&status=success&mock=true`
                }

                toast.success('Төлем сәтті өтті!')
                setIsSuccess(true)
                setTimeout(() => {
                    router.push(redirectUrl)
                }, 1500)
            } catch (err) {
                console.error('Mock Payment Error:', err)
                setIsPaying(false)
                alert('Payment failed in database update. Check console.')
            }
        }, 2000)
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="flex items-center justify-between mb-2 px-2">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => router.back()}
                            className="text-white hover:bg-white/10 rounded-full h-10 w-10"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter text-white lowercase">
                                freedom<span className="text-primary italic">pay</span>
                            </h1>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">
                                {locale === 'kk' ? 'Тест режимі' : 'Тестовый режим'}
                            </p>
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {!isSuccess ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-zinc-900/50 backdrop-blur-xl border border-white/5">
                                <CardContent className="p-8 space-y-8">
                                    {/* Premium Card Visualizer */}
                                    <div className="relative group perspective-1000">
                                        <div className="bg-gradient-to-br from-zinc-800 to-black rounded-3xl p-6 text-white space-y-10 relative overflow-hidden h-52 border border-white/10 shadow-2xl transition-transform duration-500 group-hover:rotate-1">
                                            <div className="flex justify-between items-start relative z-10">
                                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center backdrop-blur-md">
                                                    <CreditCard className="w-6 h-6 text-zinc-400" />
                                                </div>
                                                <div className="h-8 w-12 bg-white/10 rounded-md backdrop-blur-sm self-center" />
                                            </div>
                                            
                                            <div className="space-y-1 relative z-10">
                                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{locale === 'kk' ? 'Карта нөмірі' : 'Номер карты'}</p>
                                                <p className="text-2xl font-mono tracking-[0.2em] tabular-nums text-white/90">
                                                    {cardNumber || '•••• •••• •••• ••••'}
                                                </p>
                                            </div>

                                            <div className="flex justify-between items-end relative z-10">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{locale === 'kk' ? 'Иесі' : 'Владелец'}</p>
                                                    <p className="text-xs font-black uppercase tracking-wider truncate max-w-[150px]">{name || 'Your Name'}</p>
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{locale === 'kk' ? 'Мерзімі' : 'Срок'}</p>
                                                    <p className="text-xs font-black tabular-nums">{expiry || 'MM/YY'}</p>
                                                </div>
                                            </div>

                                            {/* Decorative patterns */}
                                            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full -mr-10 -mt-10 blur-[80px]" />
                                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full -ml-10 -mb-10 blur-[60px]" />
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{locale === 'kk' ? 'Карта нөмірі' : 'Номер карты'}</label>
                                            <Input
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                                placeholder="0000 0000 0000 0000"
                                                maxLength={19}
                                                className="rounded-2xl h-14 bg-zinc-900 border-white/5 px-5 font-black tracking-widest focus:ring-primary focus:border-primary text-white"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{locale === 'kk' ? 'Мерзімі' : 'Срок'}</label>
                                                <Input
                                                    value={expiry}
                                                    onChange={(e) => {
                                                        let v = e.target.value.replace(/\D/g, '')
                                                        if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2, 4)
                                                        setExpiry(v)
                                                    }}
                                                    placeholder="MM/YY"
                                                    maxLength={5}
                                                    className="rounded-2xl h-14 bg-zinc-900 border-white/5 px-5 font-black text-white"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">CVV</label>
                                                <Input
                                                    value={cvv}
                                                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="•••"
                                                    maxLength={3}
                                                    type="password"
                                                    className="rounded-2xl h-14 bg-zinc-900 border-white/5 px-5 font-black text-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{locale === 'kk' ? 'Аты-жөні' : 'Имя владельца'}</label>
                                            <Input
                                                value={name}
                                                onChange={(e) => setName(e.target.value.toUpperCase())}
                                                placeholder="IVAN IVANOV"
                                                className="rounded-2xl h-14 bg-zinc-900 border-white/5 px-5 font-black uppercase text-white"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handlePay}
                                        disabled={isPaying || cardNumber.length < 16}
                                        className="w-full h-16 rounded-[2rem] bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-2xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {isPaying ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                {locale === 'kk' ? 'Өңделуде...' : 'Обработка...'}
                                            </div>
                                        ) : `${locale === 'kk' ? 'ТӨЛЕУ' : 'ОПЛАТИТЬ'} ${amount} ₸`}
                                    </Button>

                                    <div className="flex items-center justify-center gap-3 text-[10px] text-zinc-600 uppercase font-black tracking-[0.2em]">
                                        <Lock className="w-3 h-3 text-primary" />
                                        {locale === 'kk' ? 'ҚАУІПСІЗ ТӨЛЕМ' : 'БЕЗОПАСНЫЙ ПЛАТЕЖ'}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-900 border border-white/5 rounded-[3rem] p-12 text-center space-y-8 shadow-2xl"
                        >
                            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary border border-primary/20 shadow-[0_0_40px_rgba(var(--primary),0.2)]">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{locale === 'kk' ? 'СӘТТІ!' : 'УСПЕШНО!'}</h2>
                                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">{locale === 'kk' ? 'Төлем қабылданды. Қайта бағытталуда...' : 'Платеж принят. Перенаправление...'}</p>

                                <div className="pt-8 border-t border-white/5">
                                    <Button
                                        variant="outline"
                                        className="w-full h-14 rounded-2xl border-white/5 bg-zinc-800 text-white hover:bg-zinc-750 gap-3 font-black uppercase text-xs tracking-widest"
                                        asChild
                                    >
                                        <a
                                            href={`https://wa.me/?text=${encodeURIComponent(`Order Tracking: ${window.location.origin}/orders/${orderId || reservationId}`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <MessageCircle className="w-5 h-5 text-primary" />
                                            {locale === 'kk' ? 'WhatsApp-қа сақтау' : 'Сохранить в WhatsApp'}
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
