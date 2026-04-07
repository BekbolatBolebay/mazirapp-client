"use client";

import { useEffect } from 'react'
import { getFcmToken, onMessageListener } from '@/lib/firebase'
import { toast } from 'sonner'

export function FCMHandler() {
    useEffect(() => {
        const setupFCM = async () => {
            try {
                const token = await getFcmToken()
                
                if (token) {
                    // Update token in our SQL database via API
                    await fetch('/api/admin/profile/fcm', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fcm_token: token })
                    })
                }

                // Listen for foreground messages
                onMessageListener().then((payload: any) => {
                    console.log('[FCMHandler] Foreground message received:', payload)
                    toast.success(payload.notification?.title || 'Новое уведомление', {
                        description: payload.notification?.body,
                    })
                })
            } catch (error) {
                console.error('[FCMHandler] Error setting up FCM:', error)
            }
        }

        setupFCM()
    }, [])

    return null
}
