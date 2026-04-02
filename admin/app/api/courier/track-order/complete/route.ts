import { NextResponse } from 'next/server'
import pb from '@/utils/pocketbase'

export async function POST(req: Request) {
    try {
        const { token } = await req.json()

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 })
        }

        console.log('[Track Order Complete] Attempting to complete order with token:', token)

        // 1. Find order by tracking token
        const record = await pb.collection('orders').getFirstListItem(`courier_tracking_token="${token}"`)

        if (!record) {
            console.warn('[Track Order Complete] No order found with token:', token)
            return NextResponse.json({ error: 'Тапсырыс табылмады немесе сілтеме қате' }, { status: 404 })
        }

        // 2. Update order status
        const updatedRecord = await pb.collection('orders').update(record.id, {
            status: 'delivered',
        })

        console.log('[Track Order Complete] Success for Order:', updatedRecord.order_number)
        return NextResponse.json({ success: true, order: updatedRecord })
    } catch (error: any) {
        console.error('[Track Order Complete] Unexpected Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
