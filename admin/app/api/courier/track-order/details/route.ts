import { NextResponse } from 'next/server'
import pb from '@/utils/pocketbase'

export async function POST(req: Request) {
    try {
        const { token } = await req.json()

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 })
        }

        // Fetch order by tracking token bypassing RLS if needed
        // Assuming 'orders' collection has 'courier_tracking_token' field
        const record = await pb.collection('orders').getFirstListItem(`courier_tracking_token="${token}"`, {
            expand: 'order_items_via_order_id', // Adjust based on PocketBase relation name
        })

        if (!record) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Map PocketBase record to expected frontend structure
        const order = {
            ...record,
            items: record.expand?.order_items_via_order_id || [],
        }

        return NextResponse.json(order)
    } catch (error: any) {
        console.error('[Track Order Details] Unexpected Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
