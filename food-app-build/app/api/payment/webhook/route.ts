import { NextResponse } from 'next/server'
import pb from '@/utils/pocketbase'
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

        // 1. Get restaurant credentials to validate signature via PocketBase
        let targetCollection: 'orders' | 'reservations' = 'orders'
        let entity: any = null

        // Try orders first
        try {
            entity = await pb.collection('orders').getOne(orderId, {
                expand: 'cafe_id'
            })
            targetCollection = 'orders'
        } catch (e) {
            // Try reservations if order not found
            try {
                entity = await pb.collection('reservations').getOne(orderId, {
                    expand: 'cafe_id'
                })
                targetCollection = 'reservations'
            } catch (e2) {
                console.error('Payment Webhook - Entity not found for ID:', orderId)
                return NextResponse.json({ error: 'Order or Reservation not found' }, { status: 404 })
            }
        }

        const restaurant = entity.expand?.cafe_id
        const secretKey = restaurant?.freedom_payment_secret_key || restaurant?.freedom_secret_key || process.env.FREEDOM_PAYMENT_SECRET_KEY
        
        if (!secretKey) {
            console.error('Payment Webhook - Merchant secret not found for entity:', orderId)
            return NextResponse.json({ error: 'Merchant secret not found' }, { status: 500 })
        }

        // 2. Validate signature
        // Note: 'webhook' is used as the script name for signature validation here
        const isValid = validateFreedomSignature('webhook', params, secretKey)

        if (!isValid) {
            console.error('Signature validation failed for entity:', orderId)
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        // 3. Verify amount
        const pgAmount = parseFloat(params.pg_amount)
        const expectedAmount = parseFloat(entity.total_amount)

        if (pgAmount < expectedAmount) {
            console.error('Amount mismatch for entity:', orderId, 'Expected:', expectedAmount, 'Received:', pgAmount)
            return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
        }

        // 4. Update status based on pg_result
        const isPaid = params.pg_result === '1'
        const paymentStatus = isPaid ? 'paid' : 'failed'

        const updates: any = {
            payment_status: paymentStatus,
            updated_at: new Date().toISOString()
        }

        if (isPaid) {
            updates.status = (targetCollection === 'orders') ? 'preparing' : 'confirmed'
        }

        await pb.collection(targetCollection).update(orderId, updates)

        // 5. Handle Card Storage
        const cardId = params.pg_card_id
        const userId = params.pg_user_id

        if (isPaid && cardId && userId) {
            console.log('Payment Webhook - Saving card for user:', userId)
            try {
                await pb.collection('user_cards').create({
                    user_id: userId,
                    pg_card_id: cardId,
                    pg_card_hash: params.pg_card_hash || '****',
                    pg_card_month: params.pg_card_month,
                    pg_card_year: params.pg_card_year,
                    bank_name: params.pg_bank,
                })
            } catch (err) {
                // If create fails (maybe unique constraint), try update
                console.log('Card might already exist, attempting update...')
                const existing = await pb.collection('user_cards').getFirstListItem(`user_id="${userId}" && pg_card_id="${cardId}"`).catch(() => null)
                if (existing) {
                    await pb.collection('user_cards').update(existing.id, {
                        pg_card_hash: params.pg_card_hash || '****',
                        pg_card_month: params.pg_card_month,
                        pg_card_year: params.pg_card_year,
                        bank_name: params.pg_bank,
                    })
                }
            }
        }

        // 6. Respond to Freedom Pay
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
