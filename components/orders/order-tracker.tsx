'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, CheckCircle2, Package, Bike, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

const statusSteps = [
    { key: 'pending', label: 'Қабылданды', icon: CheckCircle2 },
    { key: 'accepted', label: 'Қабылданды', icon: CheckCircle2 },
    { key: 'preparing', label: 'Дайындалуда', icon: Clock },
    { key: 'ready', label: 'Дайын', icon: Package },
    { key: 'on_the_way', label: 'Жолда', icon: Bike },
    { key: 'delivering', label: 'Жолда', icon: Bike },
    { key: 'delivered', label: 'Жеткізілді', icon: CheckCircle2 },
]

const statusMap: Record<string, number> = {
    'new': 0,
    'pending': 0,
    'awaiting_payment': 0.5,
    'accepted': 1,
    'preparing': 2,
    'ready': 3,
    'on_the_way': 4,
    'delivering': 4,
    'delivered': 5,
    'completed': 5,
    'cancelled': -1,
}

interface OrderTrackerProps {
    orderId: string
    initialStatus: string
    initialUpdatedAt: string
}

export function OrderTracker({ orderId, initialStatus, initialUpdatedAt }: OrderTrackerProps) {
    const [status, setStatus] = useState(initialStatus)
    const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt)

    useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel(`order-status-${orderId}`)
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
                    const newUpdatedAt = payload.new.updated_at

                    if (newStatus !== status) {
                        setStatus(newStatus)
                        setUpdatedAt(newUpdatedAt)
                        toast.info(`Тапсырыс күйі өзгерді: ${newStatus}`)

                        // Try to vibrate if supported
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
    }, [orderId, status])

    const currentStep = statusMap[status] ?? 0

    if (status === 'cancelled') {
        return (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-700">
                <XCircle className="w-6 h-6" />
                <div>
                    <p className="font-bold">Тапсырыс тоқтатылды</p>
                    <p className="text-xs opacity-80">{format(new Date(updatedAt), 'HH:mm')}</p>
                </div>
            </div>
        )
    }

    // Define unique steps to display (to avoid showing both 'pending' and 'accepted' if they mean the same for UI)
    const displaySteps = [
        { key: 'accepted', label: 'Қабылданды', icon: CheckCircle2 },
        { key: 'preparing', label: 'Дайындалуда', icon: Clock },
        { key: 'ready', label: 'Дайын', icon: Package },
        { key: 'on_the_way', label: 'Жолда', icon: Bike },
    ]

    return (
        <div className="space-y-4">
            {status === 'delivered' || status === 'completed' ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <h2 className="font-bold text-lg text-green-800">Жеткізілді!</h2>
                    <p className="text-sm text-green-700">
                        Тапсырысыңыз {format(new Date(updatedAt), 'HH:mm')} сәтті жеткізілді
                    </p>
                </div>
            ) : (
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-4 border border-primary/10">
                    <h2 className="font-bold text-lg mb-1">Тапсырыс күйі</h2>
                    <p className="text-sm text-muted-foreground mb-4">Жаңартылды: {format(new Date(updatedAt), 'HH:mm')}</p>

                    <div className="space-y-4">
                        {displaySteps.map((step, index) => {
                            const stepIndex = statusMap[step.key]
                            const isCompleted = currentStep >= stepIndex
                            const isActive = status === step.key || ((status === 'pending' || status === 'new') && step.key === 'accepted')
                            const Icon = step.icon

                            return (
                                <div key={step.key} className="flex items-center gap-3">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${isCompleted ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'
                                            } ${isActive ? 'ring-4 ring-primary/20 animate-pulse' : ''}`}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-bold ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {step.label}
                                        </p>
                                        {isActive && (
                                            <p className="text-[10px] text-primary font-bold animate-bounce mt-0.5">Қазір осы кезеңде</p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
