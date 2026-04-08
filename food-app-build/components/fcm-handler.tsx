'use client'

import { useEffect } from 'react'
import { getFcmToken, onMessageListener } from '@/lib/firebase'
import { useAuth } from '@/lib/auth/auth-context'
import { toast } from 'sonner'

export function FCMHandler() {
    const { profile } = useAuth()

    useEffect(() => {
        const setupFCM = async () => {
            try {
                if (!profile?.id) return

                const token = await getFcmToken()
                
                if (token) {
                    await fetch('/api/profile/fcm-token', {
                        method: 'POST',
                        body: JSON.stringify({ token, userId: profile.id }),
                        headers: { 'Content-Type': 'application/json' }
                    })
                }

                // Listen for foreground messages
                onMessageListener().then((payload: any) => {
                    console.log('[FCMHandler] Foreground message received:', payload)
                    toast.success(payload.notification?.title || 'Жаңа хабарлама', {
                        description: payload.notification?.body,
                    })
                })
            } catch (error) {
                console.error('[FCMHandler] Error setting up FCM:', error)
            }
        }

        setupFCM()
    }, [profile?.id])

    return null
}
