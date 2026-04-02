'use server'

import webpush from 'web-push'
import pb from '@/utils/pocketbase'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:example@yourdomain.com'

// Configure web push with retry logic
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        VAPID_SUBJECT,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    )
    console.log('[Notifications] Web push configured successfully')
} else {
    console.warn('[Notifications] VAPID keys not configured! Push notifications will not work.')
}

export async function notifyCustomer(
    customerId: string,
    payload: { title: string; body: string; url?: string },
    retries = 3
) {
    const startTime = Date.now()
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const user = pb.authStore.model

            if (!user) {
                throw new Error('Unauthorized: No user session')
            }

            // Verify role (admin or super_admin)
            const profile = await pb.collection('staff_profiles').getOne(user.id)

            if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
                throw new Error('Forbidden: User is not an admin')
            }

            // Fetch customer push info from PocketBase
            let customer: any = null
            try {
                customer = await pb.collection('clients').getOne(customerId)
            } catch (e) {
                // Try staff_profiles table (in case admin is the customer, e.g. testing)
                try {
                    customer = await pb.collection('staff_profiles').getOne(customerId)
                } catch (ee) {
                    console.log(`[Notifications] Customer ${customerId} not found in clients or staff_profiles`)
                }
            }

            if (!customer || (!customer.push_subscription && !customer.fcm_token)) {
                console.log(`[Notifications] Customer ${customerId} has no push subscription/token`)
                return { success: false, error: 'No subscription found' }
            }

            const pushPromises: Promise<any>[] = []

            // 1. Web-Push (Legacy)
            if (customer.push_subscription && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
                const subObj = typeof customer.push_subscription === 'string' 
                    ? JSON.parse(customer.push_subscription) 
                    : customer.push_subscription
                
                pushPromises.push(
                    webpush.sendNotification(subObj, JSON.stringify(payload))
                )
            }

            // 2. Firebase FCM
            if (customer.fcm_token) {
                const { messaging } = await import('./firebase-admin')
                const message = {
                    token: customer.fcm_token,
                    notification: {
                        title: payload.title,
                        body: payload.body,
                    },
                    data: {
                        url: payload.url || '/',
                    },
                    webpush: {
                        fcmOptions: {
                            link: payload.url || '/',
                        },
                    },
                }
                pushPromises.push((messaging as any).send(message))
            }

            await Promise.all(pushPromises)

            console.log(`[Notifications] Sent to customer ${customerId} on attempt ${attempt}`)
            return { success: true, attempts: attempt }
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error))
            if (attempt < retries) {
                const backoffMs = Math.pow(3, attempt - 1) * 100
                await new Promise((resolve) => setTimeout(resolve, backoffMs))
            }
        }
    }

    console.error(`[Notifications] Failed for customer ${customerId}:`, lastError?.message)
    return { success: false, error: lastError?.message }
}

