'use server'

import { createClient } from '@/lib/supabase/server'
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

export async function notifyAdmin(data: any, type: 'order' | 'booking') {
    // 1. Disable Telegram (as per user request)
    // notifyAdminTelegram(data, restaurant) -- OLD

    try {
        const supabase = await createClient()

        // 2. Find all admin users (role = 'admin') who have a push_subscription
        const { data: admins } = await supabase
            .from('users')
            .select('push_subscription')
            .eq('role', 'admin')
            .not('push_subscription', 'is', null)

        if (!admins || admins.length === 0) {
            console.log('No admins with push subscriptions found')
            return
        }

        const orderId = data.id.slice(0, 8)
        const payload = {
            title: type === 'order' ? 'Новый заказ!' : 'Новое бронирование!',
            body: type === 'order'
                ? `Заказ #${orderId} на сумму ${data.total_amount}₸`
                : `Бронь на ${data.date} в ${data.time} (${data.guests_count} чел)`,
            url: type === 'order' ? '/orders' : '/reservations'
        }

        // 3. Send Push to all active admins
        const pushPromises = admins.map(admin =>
            webpush.sendNotification(
                admin.push_subscription as any,
                JSON.stringify(payload)
            ).catch(err => console.error('Error sending push to admin:', err))
        )

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
