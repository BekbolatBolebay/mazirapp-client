"use client";


import { useEffect } from 'react'
import { getFcmToken, onMessageListener } from '@/lib/firebase'
import pb from '@/utils/pocketbase'
import { toast } from 'sonner'

export function FCMHandler() {
    useEffect(() => {
        const setupFCM = async () => {
            try {
                const user = pb.authStore.model
                
                if (!user) return

                const token = await getFcmToken()
                
                if (token) {
                    // Update token in users collection (was staff_profiles in Supabase)
                    await pb.collection('users').update(user.id, { 
                        fcm_token: token,
                        updated_at: new Date().toISOString()
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
