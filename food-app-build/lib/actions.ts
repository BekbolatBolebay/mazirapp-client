'use server'

import pb from '@/utils/pocketbase'
import webpush from 'web-push'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:example@yourdomain.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        VAPID_SUBJECT,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    )
}

export async function notifyAdmin(data: any, type: 'order' | 'booking', restaurantId?: string) {
    try {
        const { messaging } = await import('./firebase-admin')
        
        // 1. Determine which admin to notify via PocketBase
        let admins: any[] = []

        if (restaurantId) {
            const restaurant = await pb.collection('restaurants').getOne(restaurantId)
            if (restaurant?.owner_id) {
                const owner = await pb.collection('users').getOne(restaurant.owner_id)
                if (owner) admins.push(owner)
            }
        } else {
            // Global admins
            admins = await pb.collection('users').getFullList({
                filter: 'role = "admin"'
            })
        }

        if (admins.length === 0) {
            console.log('No admins found to notify')
            return
        }

        if (!admins || admins.length === 0) {
            console.log('No admins found for this restaurant')
            return
        }

        const orderId = data.id.slice(0, 8)
        const payload = {
            title: type === 'order'
                ? `🔔 Жаңа тапсырыс! / Новый заказ!`
                : `🗓 Жаңа брондау! / Новое бронирование!`,
            body: type === 'order'
                ? `#${orderId} тапсырысы • ${data.total_amount}₸`
                : `${data.date} күні, ${data.time?.slice(0, 5)} уақытта • ${data.guests_count} адам • ${data.total_amount}₸`,
            // Admin views both orders and reservations on /orders page (two tabs)
            url: '/orders'
        }

        // 2. Send Push via Web-Push (Legacy) and Firebase (FCM)
        const pushPromises: Promise<any>[] = []

        admins.forEach((admin: any) => {
            // Web-Push
            if (admin.push_subscription && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
                pushPromises.push(
                    webpush.sendNotification(
                        admin.push_subscription as any,
                        JSON.stringify(payload)
                    ).catch(err => console.error('Web-Push Error:', err))
                )
            }

            // Firebase FCM
            if (admin.fcm_token) {
                const message = {
                    token: admin.fcm_token,
                    notification: {
                        title: payload.title,
                        body: payload.body,
                    },
                    data: {
                        url: payload.url,
                        orderId: data.id,
                        type: type, // 'order' or 'booking' — used by firebase-messaging-sw.js
                    },
                    webpush: {
                        notification: {
                            icon: '/icon-192x192.png',
                            badge: '/icon-light-32x32.png',
                            requireInteraction: true,
                            vibrate: [200, 100, 200, 100, 200],
                        },
                        fcmOptions: {
                            link: payload.url,
                        },
                    },
                }

                pushPromises.push(
                    (messaging as any).send(message)
                        .then((response: any) => console.log('FCM Success:', response))
                        .catch((error: any) => console.error('FCM Error:', error))
                )
            }
        })

        await Promise.all(pushPromises)
    } catch (error) {
        console.error('Error notifying admins:', error)
    }
}

// Deprecated: keeping only for reference, but wont be called
export async function notifyAdminTelegram(order: any, restaurant: any) {
    // Disabled
    return
}
