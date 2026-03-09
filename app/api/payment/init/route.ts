import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateFreedomSignature } from '@/utils/payment-helpers'

export async function POST(req: Request) {
    try {
        const { orderId, reservationId, amount, description, customerEmail, customerPhone } = await req.json()

        if ((!orderId && !reservationId) || !amount) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        const user = session?.user

        console.log('Payment Init Debug - Session:', session ? 'Found' : 'Missing')
        if (authError) console.error('Payment Init Debug - Auth Error:', authError)

        let restaurant: any = null
        let finalId = orderId || reservationId

        // 1. Get order/reservation and restaurant details
        if (orderId) {
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .select('*, restaurants!orders_restaurant_id_fkey(*)')
                .eq('id', orderId)
                .single()

            if (orderError) {
                console.error('Payment Init - Order Query Error:', orderError)
                return NextResponse.json({ error: 'Order not found', orderId }, { status: 404 })
            }
            restaurant = order.restaurants
        } else if (reservationId) {
            const { data: res, error: resError } = await supabase
                .from('reservations')
                .select('*, restaurants(*)')
                .eq('id', reservationId)
                .single()

            if (resError) {
                console.error('Payment Init - Reservation Query Error:', resError)
                return NextResponse.json({ error: 'Reservation not found', reservationId }, { status: 404 })
            }
            restaurant = res.restaurants
        }

        if (!restaurant) {
            return NextResponse.json({ error: 'Restaurant details not found' }, { status: 500 })
        }

        const merchantId = restaurant.freedom_merchant_id
        const secretKey = restaurant.freedom_secret_key

        console.log('Payment Init Debug - Merchant ID:', merchantId ? 'Present' : 'MISSING')
        console.log('Payment Init Debug - Secret Key:', secretKey ? 'Present' : 'MISSING')

        // MOCK MODE: If credentials are missing, allow testing via a mock redirect
        if (!merchantId || !secretKey) {
            console.warn('⚠️ Freedom Pay credentials missing. ENTERING MOCK MODE for testing.');

            // Generate a mock card entry URL
            const mockCardUrl = `/checkout/mock-card?${orderId ? `orderId=${orderId}` : `reservationId=${reservationId}`}&amount=${amount}`;

            return NextResponse.json({
                redirectUrl: mockCardUrl,
                isMock: true,
                message: 'Testing mode: Redirecting to mock card entry form'
            })
        }

        // 2. Prepare Freedom Pay parameters
        const params: any = {
            pg_merchant_id: merchantId,
            pg_amount: amount,
            pg_currency: 'KZT',
            pg_order_id: finalId, // Use either orderId or reservationId
            pg_description: description || `Payment for #${finalId.slice(0, 8)}`,
            pg_salt: Math.random().toString(36).substring(7),
            pg_language: 'ru',
            pg_testing_mode: restaurant.freedom_test_mode ? 1 : 0,
            // Webhook and redirect URLs
            pg_result_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
            pg_success_url: orderId
                ? `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}?status=success`
                : `${process.env.NEXT_PUBLIC_APP_URL}/booking/${restaurant.id}?step=status&reservationId=${reservationId}`,
            pg_failure_url: orderId
                ? `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}?status=failure`
                : `${process.env.NEXT_PUBLIC_APP_URL}/booking/${restaurant.id}?step=confirm&reservationId=${reservationId}&error=payment_failed`,
        }

        if (customerEmail) params.pg_user_contact_email = customerEmail
        if (customerPhone) params.pg_user_phone = customerPhone

        // 3. Generate signature
        const sig = generateFreedomSignature('init_payment.php', params, secretKey)
        params.pg_sig = sig

        // 4. Send request to Freedom Pay
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

        const resultText = await response.text()

        const redirectUrlMatch = resultText.match(/<pg_redirect_url>(.*?)<\/pg_redirect_url>/)
        const errorDescriptionMatch = resultText.match(/<pg_error_description>(.*?)<\/pg_error_description>/)

        if (redirectUrlMatch && redirectUrlMatch[1]) {
            return NextResponse.json({ redirectUrl: redirectUrlMatch[1] })
        } else {
            const errorMsg = errorDescriptionMatch ? errorDescriptionMatch[1] : 'Failed to get redirect URL'
            return NextResponse.json({ error: errorMsg, raw: resultText }, { status: 500 })
        }

    } catch (error: any) {
        console.error('Freedom Pay Init Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
