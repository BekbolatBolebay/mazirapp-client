import { NextResponse } from 'next/server'
import pb from '@/utils/pocketbase'
import webpush from 'web-push'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:example@yourdomain.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

const statusMap: Record<string, Record<string, string>> = {
    'accepted': { 'kk': 'Тапсырыс қабылданды!', 'ru': 'Тапсырыс қабылданды!' },
    'preparing': { 'kk': 'Тапсырыс дайындалуда!', 'ru': 'Заказ готовится!' },
    'ready': { 'kk': 'Тапсырыс дайын!', 'ru': 'Заказ готов!' },
    'on_the_way': { 'kk': 'Курьер жолда!', 'ru': 'Курьер в пути!' },
    'completed': { 'kk': 'Рахмет! Тапсырыс аяқталды.', 'ru': 'Спасибо! Заказ завершен.' },
    'cancelled': { 'kk': 'Тапсырыс тоқтатылды.', 'ru': 'Заказ отменен.' },
}

async function sendNotificationWithRetry(subscription: any, payload: any, retries = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const subObj = typeof subscription === 'string' ? JSON.parse(subscription) : subscription
            await webpush.sendNotification(subObj, JSON.stringify(payload))
            return true
        } catch (error) {
            if (attempt < retries) await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 200))
        }
    }
    return false
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { record, table } = body // Simplified payload

        const customerId = record.user_id || record.customer_id
        if (!customerId) return NextResponse.json({ error: 'Customer ID not found' }, { status: 400 })

        // Fetch customer from PocketBase (trying users collection first)
        const customer = await pb.collection('users').getOne(customerId).catch(() => null)
        if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

        const lang = (customer.language || customer.preferred_language) === 'kk' ? 'kk' : 'ru'
        const statusMessage = statusMap[record.status]?.[lang] || `Status: ${record.status}`

        const payload = {
            title: 'Mazir App',
            body: statusMessage,
            url: table === 'reservations' ? `/reservations/${record.id}` : `/orders/${record.id}`,
        }

        const pushPromises: Promise<any>[] = []

        if (customer.push_subscription) {
            pushPromises.push(sendNotificationWithRetry(customer.push_subscription, payload))
        }

        if (customer.fcm_token) {
            try {
                const { messaging } = await import('@/lib/firebase-admin')
                pushPromises.push(messaging.send({
                    token: customer.fcm_token,
                    notification: { title: payload.title, body: payload.body },
                    data: { url: payload.url, orderId: record.id },
                    webpush: { fcmOptions: { link: payload.url } }
                }).catch(err => console.error('FCM Error:', err)))
            } catch (err) { console.error('Firebase Admin Error:', err) }
        }

        await Promise.all(pushPromises)
        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Status Change Webhook Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
