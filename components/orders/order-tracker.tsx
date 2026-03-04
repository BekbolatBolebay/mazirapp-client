'use client'

import { useState, useEffect } from 'react'
import {
    Clock,
    CheckCircle2,
    Package,
    Bike,
    PartyPopper,
    CreditCard,
    Flame,
    Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/i18n-context'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface OrderTrackerProps {
    orderId: string
    initialStatus: string
    initialUpdatedAt: string
    orderType?: 'delivery' | 'pickup' | 'booking'
}

interface StatusStep {
    key: string
    icon: typeof Clock
    label: string
    gradient: string
    textColor: string
    bgColor: string
}

export function OrderTracker({ orderId, initialStatus, initialUpdatedAt, orderType = 'delivery' }: OrderTrackerProps) {
    const { t, locale } = useI18n()
    const [status, setStatus] = useState(initialStatus)
    const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const supabase = createClient()
        const channel = supabase
            .channel(`order-tracker-${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderId}`
                },
                (payload) => {
                    const newStatus = payload.new.status
                    if (newStatus !== status) {
                        setStatus(newStatus)
                        setUpdatedAt(payload.new.updated_at)
                        const translatedStatus = (t.orders.status as any)[newStatus] || newStatus
                        toast.info(`${t.orders.statusChangedToast}${translatedStatus}`)

                        if (typeof navigator !== 'undefined' && navigator.vibrate) {
                            navigator.vibrate([200, 100, 200])
                        }
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [orderId, status, t])

    const normalizedStatus = (status || '').toLowerCase().trim()

    const pickupSteps: StatusStep[] = [
        { key: 'pending', icon: Clock, label: (t.orders.status as any).pending, gradient: 'from-slate-400 to-slate-600', textColor: 'text-slate-700', bgColor: 'bg-slate-100' },
        { key: 'awaiting_payment', icon: CreditCard, label: (t.orders.status as any).awaiting_payment || 'Төлем жасай', gradient: 'from-amber-400 to-amber-600', textColor: 'text-amber-700', bgColor: 'bg-amber-100' },
        { key: 'accepted', icon: CheckCircle2, label: (t.orders.status as any).accepted, gradient: 'from-blue-400 to-blue-600', textColor: 'text-blue-700', bgColor: 'bg-blue-100' },
        { key: 'preparing', icon: Flame, label: (t.orders.status as any).preparing, gradient: 'from-orange-400 to-orange-600', textColor: 'text-orange-700', bgColor: 'bg-orange-100' },
        { key: 'ready', icon: Package, label: (t.orders.status as any).ready, gradient: 'from-emerald-400 to-emerald-600', textColor: 'text-emerald-700', bgColor: 'bg-emerald-100' },
        { key: 'completed', icon: PartyPopper, label: (t.orders.status as any).completed, gradient: 'from-green-400 to-green-600', textColor: 'text-green-700', bgColor: 'bg-green-100' },
    ]

    const deliverySteps: StatusStep[] = [
        { key: 'pending', icon: Clock, label: (t.orders.status as any).pending, gradient: 'from-slate-400 to-slate-600', textColor: 'text-slate-700', bgColor: 'bg-slate-100' },
        { key: 'awaiting_payment', icon: CreditCard, label: (t.orders.status as any).awaiting_payment || 'Төлем жасай', gradient: 'from-amber-400 to-amber-600', textColor: 'text-amber-700', bgColor: 'bg-amber-100' },
        { key: 'accepted', icon: CheckCircle2, label: (t.orders.status as any).accepted, gradient: 'from-blue-400 to-blue-600', textColor: 'text-blue-700', bgColor: 'bg-blue-100' },
        { key: 'preparing', icon: Flame, label: (t.orders.status as any).preparing, gradient: 'from-orange-400 to-orange-600', textColor: 'text-orange-700', bgColor: 'bg-orange-100' },
        { key: 'ready', icon: Package, label: (t.orders.status as any).ready, gradient: 'from-yellow-400 to-yellow-600', textColor: 'text-yellow-700', bgColor: 'bg-yellow-100' },
        { key: 'on_the_way', icon: Bike, label: (t.orders.status as any).on_the_way, gradient: 'from-purple-400 to-purple-600', textColor: 'text-purple-700', bgColor: 'bg-purple-100' },
        { key: 'delivered', icon: CheckCircle2, label: (t.orders.status as any).delivered, gradient: 'from-emerald-400 to-emerald-600', textColor: 'text-emerald-700', bgColor: 'bg-emerald-100' },
        { key: 'completed', icon: PartyPopper, label: (t.orders.status as any).completed, gradient: 'from-green-400 to-green-600', textColor: 'text-green-700', bgColor: 'bg-green-100' },
    ]

    const allSteps = orderType === 'pickup' ? pickupSteps : deliverySteps
    const currentIndex = allSteps.findIndex(s => s.key === normalizedStatus)
    const displayIndex = currentIndex === -1 ? 0 : currentIndex
    const currentStepData = allSteps[displayIndex] || allSteps[0]

    return (
        <div className="space-y-6">
            <div className={cn(
                "rounded-3xl p-6 transition-all duration-700 shadow-lg text-white",
                `bg-gradient-to-br ${currentStepData.gradient}`
            )}>
                <div className="flex flex-col items-center text-center">
                    <div className={cn(
                        "w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 shadow-inner",
                        normalizedStatus === 'on_the_way' && 'animate-bounce'
                    )}>
                        <currentStepData.icon className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-1">
                        {currentStepData.label}
                    </h2>
                    <p className="text-white/80 text-xs font-medium">
                        {mounted && `${t.orders.updatedAtLabel}: ${new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                </div>
            </div>

            <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
                <h3 className="font-bold text-lg mb-6">
                    {locale === 'ru' ? 'Прогресс заказа' : 'Тапсырыс прогресі'}
                </h3>
                <div className="relative">
                    {/* Vertical line connecting all steps */}
                    <div className="absolute left-5 top-0 bottom-0 w-1 bg-muted" />

                    <div className="space-y-8 relative">
                        {allSteps.map((step, index) => {
                            const isCompleted = index < displayIndex
                            const isCurrent = index === displayIndex
                            const isFuture = index > displayIndex
                            const Icon = step.icon

                            return (
                                <div key={step.key} className="flex items-start gap-4 relative">
                                    {/* Step circle indicator */}
                                    <div className={cn(
                                        'relative z-10 w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 shadow-sm',
                                        isCompleted && 'bg-emerald-500 border-2 border-emerald-600',
                                        isCurrent && `bg-gradient-to-br ${step.gradient} border-2 border-white ring-4 ring-primary/20 animate-pulse`,
                                        isFuture && 'bg-muted border-2 border-muted-foreground/10'
                                    )}>
                                        {isCompleted ? (
                                            <CheckCircle2 className="w-6 h-6 text-white" />
                                        ) : (
                                            <Icon className={cn(
                                                'w-5 h-5 transition-colors',
                                                isCurrent && 'text-white',
                                                isFuture && 'text-muted-foreground/40'
                                            )} />
                                        )}
                                    </div>

                                    {/* Step content */}
                                    <div className={cn(
                                        'pt-1 flex-1 transition-all duration-300',
                                        isFuture && 'opacity-40'
                                    )}>
                                        <div className="flex items-center gap-2">
                                            <p className={cn(
                                                'font-bold text-base transition-colors',
                                                isCompleted && 'text-emerald-600',
                                                isCurrent && 'text-foreground',
                                                isFuture && 'text-muted-foreground'
                                            )}>
                                                {step.label}
                                            </p>
                                            {isCompleted && (
                                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                                                    ✓ {locale === 'ru' ? 'ЗАВЕРШЕНО' : 'АЯҚТАЛДЫ'}
                                                </span>
                                            )}
                                        </div>
                                        {isCurrent && (
                                            <p className="text-xs text-primary font-bold mt-0.5 flex items-center gap-1.5">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                {locale === 'ru' ? 'В процессе...' : 'Орындалуда...'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
