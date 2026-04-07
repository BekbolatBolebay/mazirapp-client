import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
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

        // 1. Get restaurant credentials and entity data via SQL
        // We check orders table, then reservations table if name not found
        const orderRes = await query(`
            SELECT 'orders' as type, o.id, o.total_amount, o.user_id, r.freedom_payment_secret_key, r.freedom_merchant_id
            FROM public.orders o
            JOIN public.restaurants r ON o.cafe_id = r.id
            WHERE o.id = $1
            UNION ALL
            SELECT 'reservations' as type, res.id, res.booking_fee as total_amount, res.user_id, r.freedom_payment_secret_key, r.freedom_merchant_id
            FROM public.reservations res
            JOIN public.restaurants r ON res.cafe_id = r.id
            WHERE res.id = $1
        `, [orderId])

        if (orderRes.rows.length === 0) {
            console.error('Payment Webhook - Entity not found for ID:', orderId)
            return NextResponse.json({ error: 'Order or Reservation not found' }, { status: 404 })
        }

        const entity = orderRes.rows[0]
        const secretKey = entity.freedom_payment_secret_key || process.env.FREEDOM_PAYMENT_SECRET_KEY
        
        if (!secretKey) {
            console.error('Payment Webhook - Merchant secret not found for entity:', orderId)
            return NextResponse.json({ error: 'Merchant secret not found' }, { status: 500 })
        }

        // 2. Validate signature
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
        const targetStatus = isPaid ? (entity.type === 'orders' ? 'preparing' : 'confirmed') : 'pending'

        if (entity.type === 'orders') {
            await query(
                'UPDATE public.orders SET payment_status = $1, status = $2, updated_at = NOW() WHERE id = $3',
                [paymentStatus, targetStatus, orderId]
            )
        } else {
            await query(
                'UPDATE public.reservations SET payment_status = $1, status = $2, updated_at = NOW() WHERE id = $3',
                [paymentStatus, targetStatus, orderId]
            )
        }

        // 5. Handle Card Storage (Upsert)
        const cardId = params.pg_card_id
        const userId = entity.user_id || params.pg_user_id

        if (isPaid && cardId && userId) {
            console.log('Payment Webhook - Saving card for user:', userId)
            try {
                await query(`
                    INSERT INTO user_cards (user_id, pg_card_id, pg_card_hash, pg_card_month, pg_card_year, bank_name, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW())
                    ON CONFLICT (user_id, pg_card_id) DO UPDATE SET
                    pg_card_hash = EXCLUDED.pg_card_hash,
                    pg_card_month = EXCLUDED.pg_card_month,
                    pg_card_year = EXCLUDED.pg_card_year,
                    bank_name = EXCLUDED.bank_name,
                    updated_at = NOW()
                `, [
                    userId,
                    cardId,
                    params.pg_card_hash || '****',
                    params.pg_card_month,
                    params.pg_card_year,
                    params.pg_bank
                ])
            } catch (err) {
                console.error('Card Storage Error:', err)
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
