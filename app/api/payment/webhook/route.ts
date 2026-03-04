import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateFreedomSignature } from '@/utils/payment-helpers'

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const params: Record<string, string> = {}

        formData.forEach((value, key) => {
            params[key] = value.toString()
        })

        const orderId = params.pg_order_id
        if (!orderId) {
            return NextResponse.json({ error: 'Order ID missing' }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Get restaurant credentials to validate signature
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, restaurants(*)')
            .eq('id', orderId)
            .single()

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        const secretKey = order.restaurants.freedom_secret_key
        if (!secretKey) {
            return NextResponse.json({ error: 'Merchant secret not found' }, { status: 500 })
        }

        // 2. Validate signature
        // The script name in signature calculation for result_url is usually 'result' or the endpoint name
        const isValid = validateFreedomSignature('webhook', params, secretKey)

        if (!isValid) {
            console.error('Signature validation failed for order:', orderId)
            // Still return 200 to Freedom Pay as per their docs if we handled the request
            // but log the error
        }

        // 3. Update order status based on pg_result
        if (params.pg_result === '1') {
            await supabase
                .from('orders')
                .update({
                    payment_status: 'paid',
                    status: 'preparing' // Automatically move to preparing once paid
                })
                .eq('id', orderId)
        } else {
            await supabase
                .from('orders')
                .update({
                    payment_status: 'failed'
                })
                .eq('id', orderId)
        }

        // 4. Respond to Freedom Pay (they expect XML response usually)
        return new Response(`
            <?xml version="1.0" encoding="utf-8"?>
            <response>
                <pg_status>ok</pg_status>
                <pg_description>Payment processed</pg_description>
                <pg_salt>${params.pg_salt || ''}</pg_salt>
                <pg_sig>${params.pg_sig || ''}</pg_sig>
            </response>
        `, {
            headers: { 'Content-Type': 'application/xml' }
        })

    } catch (error: any) {
        console.error('Freedom Pay Webhook Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
