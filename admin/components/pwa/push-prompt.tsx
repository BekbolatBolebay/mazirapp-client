'use client'

import { useState, useEffect } from 'react'
import { Bell, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { useApp } from '@/lib/app-context'
import { toast } from 'sonner'
import { resumeAudioContext } from '@/lib/sound-utils'
import { getFcmToken } from '@/lib/firebase'

// Utility function to convert VAPID key to Uint8Array for pushManager
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export function PushPrompt() {
    const { lang } = useApp()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Check if browser supports notifications
        if (!('Notification' in window)) {
            console.warn('[PushPrompt] Browser does not support Notifications API')
            return
        }

        console.log('[PushPrompt] Notification permission:', Notification.permission)

        // Only show if permission is 'default' (not yet asked)
        if (Notification.permission === 'default') {
            const timer = setTimeout(() => {
                console.log('[PushPrompt] Showing notification permission dialog')
                setOpen(true)
            }, 3000) // Show after 3 seconds
            return () => clearTimeout(timer)
        }
    }, [])

    const handleAllow = async () => {
        setLoading(true)
        setError(null)
        
        const startTime = Date.now()
        console.log('[PushPrompt] Starting permission request process...')

        try {
            // Step 1: Request notification permission
            console.log('[PushPrompt] Requesting notification permission')
            const permission = await Notification.requestPermission()
            
            if (permission !== 'granted') {
                const errorMsg = lang === 'ru' ? 'Уведомления были отклонены' : 'Хабарламалар қабылданбады'
                console.warn('[PushPrompt] Permission denied:', permission)
                setError(errorMsg)
                toast.error(errorMsg)
                setLoading(false)
                return
            }

            console.log('[PushPrompt] Permission granted')

            // Step 2: Check service worker support
            if (!('serviceWorker' in navigator)) {
                const errorMsg = lang === 'ru' ? 'Service Worker не поддерживается' : 'Service Worker қоса қолдау берілмеген'
                console.error('[PushPrompt]', errorMsg)
                setError(errorMsg)
                toast.error(errorMsg)
                setLoading(false)
                return
            }

            if (process.env.NODE_ENV === 'development') {
                console.warn('[PushPrompt] Running in development mode. PWA/Service Worker might be disabled in next.config.mjs')
            }

            console.log('[PushPrompt] Service Worker is supported')
            
            // Step 3: Ensure Service Worker is registered and active
            console.log('[PushPrompt] Checking existing registrations...')
            let registration = await navigator.serviceWorker.getRegistration('/sw.js')
            
            if (!registration) {
                console.log('[PushPrompt] No SW found, registering...')
                registration = await navigator.serviceWorker.register('/sw.js')
                // Wait for it to become active
                let retryCount = 0
                while (registration.installing && retryCount < 10) {
                    await new Promise(r => setTimeout(r, 500))
                    retryCount++
                }
            }

            // Step 4: Get ready registration (if not already active)
            if (!registration || !registration.active) {
                console.log('[PushPrompt] SW not active, waiting for ready...')
                registration = await Promise.race([
                    navigator.serviceWorker.ready,
                    new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error(lang === 'ru' ? 'Тайм-аут Service Worker (возможно, отключен в dev-режиме)' : 'Service Worker күту уақыты аяқталды (мүмкін dev-режимде өшірулі)')), 15000)
                    )
                ]) as ServiceWorkerRegistration
            }

            console.log('[PushPrompt] SW Active State:', registration.active?.state)
            console.log('[PushPrompt] Service worker ready, checking push manager...')

            // Step 5: Subscribe to push notifications
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
            let subscription = null
            
            if (vapidKey) {
                try {
                    // Convert VAPID key to Uint8Array (required by many browsers)
                    const convertedVapidKey = urlBase64ToUint8Array(vapidKey)
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: convertedVapidKey
                    })
                    console.log('[PushPrompt] Push subscription created successfully')
                } catch (subError) {
                    console.warn('[PushPrompt] Web-Push subscription failed, trying FCM only:', subError)
                }
            } else {
                console.warn('[PushPrompt] No VAPID key found, skipping Web-Push subscription')
            }

            // Step 6: Get FCM Token
            console.log('[PushPrompt] Getting FCM token...')
            let fcmToken = null
            try {
                fcmToken = await getFcmToken()
                if (fcmToken) {
                    console.log('[PushPrompt] FCM Token generated successfully')
                }
            } catch (fcmError) {
                console.error('[PushPrompt] FCM Token error:', fcmError)
            }
            
            if (!subscription && !fcmToken) {
                const envInfo = !vapidKey ? ' (VAPID Key missing)' : ''
                const swInfo = !registration ? ' (No SW Registration)' : ''
                throw new Error(lang === 'ru' 
                    ? `Не удалось настроить уведомления${envInfo}${swInfo}. Проверьте конфигурацию.` 
                    : `Хабарламаларды баптау мүмкін болмады${envInfo}${swInfo}. Конфигурацияны тексеріңіз.`)
            }

            // Step 7: Save subscription and FCM token to database
            console.log('[PushPrompt] Saving to database...')

            const res = await fetch('/api/admin/profile/fcm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    push_subscription: JSON.stringify(subscription),
                    fcm_token: fcmToken
                })
            })

            if (!res.ok) {
                throw new Error('Failed to save push settings')
            }

            toast.success(lang === 'ru' ? 'Уведомления успешно включены' : 'Хабарламалар сәтті қосылды')
            resumeAudioContext()
            setOpen(false)
        } catch (error: any) {
            console.error('[PushPrompt] Fatal setup error:', error)
            const msg = error.message || String(error)
            setError(msg)
            toast.error(lang === 'ru' ? 'Ошибка: ' + msg : 'Қате: ' + msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            // Prevent closing if permission is default (haven't asked yet)
            if (Notification.permission === 'default') return
            setOpen(val)
        }}>
            <DialogContent
                className="max-w-sm rounded-[2.5rem] p-8 border-none shadow-2xl overflow-hidden"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-primary" />

                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary animate-bounce">
                        <Bell className="w-10 h-10" />
                    </div>

                    <div className="space-y-2">
                        <DialogTitle className="text-2xl font-black tracking-tight">
                            {lang === 'ru' ? 'Включите уведомления' : 'Хабарламаларды қосыңыз'}
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium text-muted-foreground leading-relaxed">
                            {lang === 'ru'
                                ? 'Это необходимо администратору, чтобы первыми узнавать о новых заказах и бронированиях в реальном времени. Вы также сможете услышать звуковой сигнал при новом заказе.'
                                : 'Бұл әкімшіге жаңа тапсырыстар мен брондаулар туралы нақты уақыт режимінде бірінші болып білу үшін қажет. Сіз жаңа тапсырыс болғанда дыбыс сигналын да естей аласыз.'}
                        </DialogDescription>
                    </div>

                    {error && (
                        <div className="w-full p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="w-full pt-2">
                        <Button
                            onClick={handleAllow}
                            disabled={loading}
                            className="w-full h-14 rounded-2xl font-black text-lg gap-2 shadow-lg shadow-primary/20"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <ShieldCheck className="w-5 h-5" />
                                    {lang === 'ru' ? 'Разрешить' : 'Рұқсат ету'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
