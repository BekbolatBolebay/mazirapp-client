import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generateFreedomSignature } from '@/utils/payment-helpers'
import { query } from '@/lib/db'

export async function POST(req: Request) {
    try {
        const { orderId, reservationId, amount, description, customerEmail, customerPhone, cardId } = await req.json()

        if ((!orderId && !reservationId) || !amount) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
        }

        const cookieStore = await cookies();
        const token = cookieStore.get('pb_auth')?.value || cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let restaurant: any = null
        let record: any = null
        let finalId = orderId || reservationId

        // 1. Get order/reservation and restaurant details via PostgreSQL
        if (orderId) {
            const orderRes = await query(
                `SELECT o.*, r.freedom_merchant_id, r.freedom_payment_secret_key, r.freedom_test_mode, r.delivery_fee
                 FROM public.orders o
                 JOIN public.restaurants r ON o.cafe_id = r.id
                 WHERE o.id = $1`,
                [orderId]
            )
            const order = orderRes.rows[0]

            if (!order) {
                return NextResponse.json({ error: 'Order not found', orderId }, { status: 404 })
            }
            
            record = order
            restaurant = order
            
            // Get order items
            const itemsRes = await query(
                'SELECT * FROM public.order_items WHERE order_id = $1',
                [orderId]
            )
            restaurant.items = itemsRes.rows
        } else if (reservationId) {
            const resRes = await query(
                `SELECT rs.*, r.freedom_merchant_id, r.freedom_payment_secret_key, r.freedom_test_mode
                 FROM public.reservations rs
                 JOIN public.restaurants r ON rs.cafe_id = r.id
                 WHERE rs.id = $1`,
                [reservationId]
            )
            const res = resRes.rows[0]

            if (!res) {
                return NextResponse.json({ error: 'Reservation not found', reservationId }, { status: 404 })
            }
            
            record = res
            restaurant = res
            
            // Get reservation items (if any tables or items attached)
            // Note: Schema might vary for reservation items, assuming reservation_items table
            const itemsRes = await query(
                'SELECT * FROM reservation_items WHERE reservation_id = $1',
                [reservationId]
            ).catch(() => ({ rows: [] }))
            restaurant.items = itemsRes.rows
        }

        if (!restaurant) {
            return NextResponse.json({ error: 'Restaurant details not found' }, { status: 500 })
        }

        const merchantId = restaurant.freedom_merchant_id || process.env.FREEDOM_MERCHANT_ID
        const secretKey = restaurant.freedom_payment_secret_key || process.env.FREEDOM_PAYMENT_SECRET_KEY

        // MOCK MODE: If credentials are missing, allow testing via a mock redirect
        if (!merchantId || !secretKey) {
            console.warn('⚠️ Freedom Pay credentials missing. Redirecting to MOCK CARD.');
            const mockCardUrl = `/checkout/mock-card?${orderId ? `orderId=${orderId}` : `reservationId=${reservationId}`}&amount=${amount}`;
            return NextResponse.json({
                redirectUrl: mockCardUrl,
                isMock: true,
                message: 'Demo/Testing mode: Please configure Freedom Pay credentials.'
            })
        }

        // 2. Prepare Freedom Pay parameters
        const params: any = {
            pg_merchant_id: merchantId,
            pg_amount: record.total_amount,
            pg_currency: 'KZT',
            pg_order_id: finalId,
            pg_description: description || `Payment for #${finalId.slice(0, 8)}`,
            pg_salt: Math.random().toString(36).substring(7),
            pg_language: 'ru',
            pg_testing_mode: (restaurant.freedom_test_mode === true) ? 1 : 0,
            pg_result_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
            pg_success_url: orderId
                ? `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}?status=success`
                : `${process.env.NEXT_PUBLIC_APP_URL}/reservations/${reservationId}?status=success`,
            pg_failure_url: orderId
                ? `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}?status=failure`
                : `${process.env.NEXT_PUBLIC_APP_URL}/reservations/${reservationId}?status=failure`,
        }

        // Add User Data
        // For self-hosted Postgres, we need to get user ID from session/token
        // Assuming user ID is available in the token or we can decode it
        // For now, using a placeholder or pg_user_id if available
        // params.pg_user_id = ... 

        // Add Fiscalization Data
        if (restaurant.items && restaurant.items.length > 0) {
            const receiptData = restaurant.items.map((item: any) => ({
                name: item.name_ru || item.name_kk || 'Item',
                count: item.quantity || 1,
                price: item.price,
                type: 'service',
                vat_percent: 0,
            }))

            if (orderId && restaurant.delivery_fee > 0) {
                receiptData.push({
                    name: 'Доставка',
                    count: 1,
                    price: restaurant.delivery_fee,
                    type: 'service',
                    vat_percent: 0
                })
            }
            params.pg_receipt_data = JSON.stringify(receiptData)
        }

        if (customerEmail) params.pg_user_contact_email = customerEmail
        if (customerPhone) params.pg_user_phone = customerPhone

        const sig = generateFreedomSignature('init_payment.php', params, secretKey)
        params.pg_sig = sig

        const formData = new URLSearchParams()
        for (const key in params) {
            formData.append(key, params[key])
        }

        const response = await fetch('https://api.freedompay.kz/init_payment.php', {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })

        if (!response.ok) {
            return NextResponse.json({ error: `Freedom Pay API Error: ${response.statusText}` }, { status: 502 })
        }

        const resultText = await response.text()
        const redirectUrlMatch = resultText.match(/<pg_redirect_url>(.*?)<\/pg_redirect_url>/)

        if (redirectUrlMatch && redirectUrlMatch[1]) {
            const redirectUrl = redirectUrlMatch[1]
            // Update payment URL in PostgreSQL
            if (orderId) {
                await query('UPDATE public.orders SET payment_url = $1 WHERE id = $2', [redirectUrl, orderId])
            } else if (reservationId) {
                await query('UPDATE public.reservations SET payment_url = $1 WHERE id = $2', [redirectUrl, reservationId])
            }
            return NextResponse.json({ redirectUrl })
        } else {
            const errorDescriptionMatch = resultText.match(/<pg_error_description>(.*?)<\/pg_error_description>/)
            return NextResponse.json({ error: errorDescriptionMatch ? errorDescriptionMatch[1] : 'Failed to init payment' }, { status: 400 })
        }

    } catch (error: any) {
        console.error('Freedom Pay Init Exception:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
