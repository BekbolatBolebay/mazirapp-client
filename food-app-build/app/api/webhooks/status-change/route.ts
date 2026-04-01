import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

// Status message map with support for multiple languages
const statusMap: Record<string, Record<string, string>> = {
    'new': {
        'kk': 'Жаңа тапсырыс қабылданды!',
        'ru': 'Тапсырыс қабылданды!'
    },
    'pending': {
        'kk': 'Тапсырыс күтуде...',
        'ru': 'Брондау сұранысы қабылданды, күте тұрыңыз...'
    },
    'confirmed': {
        'kk': 'Брондау расталды! Сізді күтеміз.',
        'ru': 'Брондау расталды! Сізді күтеміз.'
    },
    'accepted': {
        'kk': 'Тапсырыс қабылданды, дайындық басталды!',
        'ru': 'Тапсырыс принят, начинаем готовить!'
    },
    'cooking': {
        'kk': 'Тағам дайындалуда...',
        'ru': 'Блюдо готовится...'
    },
    'preparing': {
        'kk': 'Тапсырыс дайындалуда!',
        'ru': 'Заказ готовится!'
    },
    'ready': {
        'kk': 'Тапсырыс дайын!',
        'ru': 'Заказ готов!'
    },
    'on_the_way': {
        'kk': 'Курьер жолда!',
        'ru': 'Курьер в пути!'
    },
    'delivered': {
        'kk': 'Ас болсын! Тапсырыс жеткізілді.',
        'ru': 'Приятного аппетита! Заказ доставлен.'
    },
    'completed': {
        'kk': 'Рахмет! Тапсырыс аяқталды.',
        'ru': 'Спасибо! Заказ завершен.'
    },
    'cancelled': {
        'kk': 'Тапсырыс тоқтатылды.',
        'ru': 'Заказ отменен.'
    },
}

/**
 * Send notification with retry logic
 */
async function sendNotificationWithRetry(
    subscription: any,
    payload: any,
    retries = 3
): Promise<boolean> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const subObj = typeof subscription === 'string' ? JSON.parse(subscription) : subscription

            await Promise.race([
                webpush.sendNotification(subObj, JSON.stringify(payload)),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Notification timeout')), 10000)
                ),
            ])

            console.log(
                `[Webhook] Notification sent successfully on attempt ${attempt}`,
                {
                    title: payload.title,
                    status: payload.status,
                }
            )
            return true
        } catch (error) {
            console.warn(
                `[Webhook] Attempt ${attempt}/${retries} failed:`,
                error instanceof Error ? error.message : String(error)
            )

            if (attempt < retries) {
                // Exponential backoff
                const backoffMs = Math.pow(2, attempt - 1) * 200
                await new Promise((resolve) => setTimeout(resolve, backoffMs))
            }
        }
    }

    return false
}

export async function POST(req: Request) {
    const requestId = Math.random().toString(36).substring(7)
    const startTime = Date.now()

    try {
        // Supabase Webhook payload
        const body = await req.json()
        const { table, record, old_record, type } = body

        console.log(`[Webhook:${requestId}] Received webhook`, {
            table,
            type,
            recordId: record?.id,
            oldStatus: old_record?.status,
            newStatus: record?.status,
        })

        // Only handle status changes
        if (type !== 'UPDATE') {
            return NextResponse.json({ message: 'Not an UPDATE event', requestId })
        }

        if (!record?.status || record.status === old_record?.status) {
            return NextResponse.json({ message: 'No status change detected', requestId })
        }

        const supabase = await createAdminClient()

        // Find the customer ID from the record
        const customerId = record.user_id || record.customer_id
        if (!customerId) {
            console.warn(`[Webhook:${requestId}] Customer ID not found in record`)
            return NextResponse.json({ message: 'Customer ID not found', requestId })
        }

        // Try to fetch customer from clients table first
        let subscription = null
        let fcmToken = null
        let customerLanguage = 'ru' // Default language

        let { data: customer } = await supabase
            .from('clients')
            .select('push_subscription, push_token, fcm_token, preferred_language, language')
            .eq('id', customerId)
            .single()

        subscription = (customer as any)?.push_subscription || (customer as any)?.push_token
        fcmToken = (customer as any)?.fcm_token
        customerLanguage = (customer as any)?.preferred_language || (customer as any)?.language || 'ru'

        // Fallback to staff_profiles if not found
        if (!subscription && !fcmToken) {
            const { data: staff } = await supabase
                .from('staff_profiles')
                .select('push_subscription, push_token, fcm_token, preferred_language, language')
                .eq('id', customerId)
                .single()
            subscription = (staff as any)?.push_subscription || (staff as any)?.push_token
            fcmToken = (staff as any)?.fcm_token
            customerLanguage = (staff as any)?.preferred_language || (staff as any)?.language || 'ru'
        }

        if (!subscription && !fcmToken) {
            console.log(`[Webhook:${requestId}] No subscription or FCM token found for customer ${customerId}`)
            return NextResponse.json({ message: 'No subscription found', requestId })
        }

        // Get status message
        const lang = customerLanguage === 'kk' ? 'kk' : 'ru'
        const statusMessage = statusMap[record.status]?.[lang] || `Status: ${record.status}`

        const payload = {
            title: record.status === 'confirmed' ? (lang === 'kk' ? 'Бронь расталды!' : 'Бронь подтверждена!') : 'Mazir App',
            body: statusMessage,
            status: record.status,
            orderId: record.id,
            url: table === 'reservations' ? `/reservations/${record.id}` : `/orders/${record.id}`,
            timestamp: new Date().toISOString(),
        }

        console.log(`[Webhook:${requestId}] Sending notification to ${customerId}`, {
            status: record.status,
            message: statusMessage,
            hasWebPush: !!subscription,
            hasFCM: !!fcmToken
        })

        const pushPromises: Promise<any>[] = []

        // 1. Web-Push
        if (subscription) {
            pushPromises.push(sendNotificationWithRetry(subscription, payload, 3))
        }

        // 2. Firebase FCM
        if (fcmToken) {
            try {
                const { messaging } = await import('@/lib/firebase-admin')
                const fcmMessage: any = {
                    token: fcmToken,
                    notification: {
                        title: payload.title,
                        body: payload.body,
                    },
                    data: {
                        url: payload.url,
                        status: payload.status,
                        orderId: record.id
                    },
                    webpush: {
                        fcmOptions: {
                            link: payload.url,
                        },
                    },
                }
                pushPromises.push(
                    messaging.send(fcmMessage)
                        .then(() => console.log(`[Webhook:${requestId}] FCM sent successfully`))
                        .catch(err => console.error(`[Webhook:${requestId}] FCM error:`, err))
                )
            } catch (err) {
                console.error(`[Webhook:${requestId}] Firebase Admin error:`, err)
            }
        }

        await Promise.all(pushPromises)

        const duration = Date.now() - startTime
        console.log(`[Webhook:${requestId}] Webhook completed in ${duration}ms`)
        return NextResponse.json({
            success: true,
            message: 'Notifications sent',
            requestId,
            duration,
        })
    } catch (error: any) {
        const duration = Date.now() - startTime
        console.error(
            `[Webhook:${requestId}] Webhook error after ${duration}ms:`,
            error instanceof Error ? error.message : String(error)
        )

        // Return 202 Accepted regardless - webhook should not fail
        // The order status update in the database already happened
        return NextResponse.json(
            {
                error: error?.message || 'Internal server error',
                requestId,
                duration,
            },
            { status: 202 }
        )
    }
}
