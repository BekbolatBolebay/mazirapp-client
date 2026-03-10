import { NextResponse } from 'next/server'
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

export async function POST(req: Request) {
    try {
        // Supabase Webhook payload
        const body = await req.json()
        const { table, record, old_record, type } = body

        // Only handle status changes
        if (type !== 'UPDATE' || record.status === old_record.status) {
            return NextResponse.json({ message: 'No status change' })
        }

        const supabase = await createClient()

        // Find the customer and their push subscription
        // If it's an order, record has user_id. If reservation, check record.customer_phone or similar
        // Actually, customers table maps id to auth.users.id
        const customerId = record.user_id || record.customer_id

        if (!customerId) {
            return NextResponse.json({ message: 'Customer ID not found in record' })
        }

        const { data: customer } = await supabase
            .from('customers')
            .select('push_subscription')
            .eq('id', customerId)
            .single()

        if (customer?.push_subscription) {
            const statusMap: any = {
                'new': 'Жаңа тапсырыс қабылданды!',
                'pending': 'Брондау сұранысы қабылданды, күте тұрыңыз...',
                'confirmed': 'Брондау расталды! Сізді күтеміз.',
                'accepted': 'Тапсырыс қабылданды, дайындық басталды!',
                'cooking': 'Тағам дайындалуда...',
                'ready': 'Тапсырыс дайын!',
                'on_the_way': 'Курьер жолда!',
                'delivered': 'Ас болсын! Тапсырыс жеткізілді.',
                'cancelled': 'Тапсырыс тоқтатылды.',
                'completed': 'Рахмет! Тапсырыс аяқталды.'
            }

            const message = statusMap[record.status] || `Тапсырыс күйі өзгерді: ${record.status}`

            const payload = {
                title: 'Mazir App',
                body: message,
                url: table === 'orders' ? `/orders/${record.id}` : `/reservations/${record.id}`
            }

            await webpush.sendNotification(
                customer.push_subscription,
                JSON.stringify(payload)
            )

            return NextResponse.json({ success: true, message: 'Notification sent' })
        }

        return NextResponse.json({ message: 'No subscription found' })
    } catch (error: any) {
        console.error('Webhook error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
