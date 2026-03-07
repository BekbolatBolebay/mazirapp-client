import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateFreedomSignature } from '@/utils/payment-helpers'

export async function POST(req: Request) {
    try {
        const { orderId, amount, description, customerEmail, customerPhone } = await req.json()

        if (!orderId || !amount) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        const user = session?.user

        console.log('Payment Init Debug - Session:', session ? 'Found' : 'Missing')
        console.log('Payment Init Debug - User ID:', user?.id)
        if (authError) console.error('Payment Init Debug - Auth Error:', authError)

        if (!user) {
            console.error('Payment Init - No authenticated user session found in API route')
            // Don't return yet, let's see if we can find the order anyway (maybe RLS is off or something)
        }

        // 1. Get order and restaurant details to find merchant credentials
        // Try fetching without join first to isolate the issue
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, restaurants!orders_restaurant_id_fkey(*)')
            .eq('id', orderId)
            .single()

        if (orderError) {
            console.error('Payment Init - Supabase Query Error:', orderError)

            // Try fetching with service role to confirm if it's an RLS issue
            const supabaseAdmin = await createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { cookies: { getAll: () => [], setAll: () => { } } }
            )
            const { data: adminOrder } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single()

            if (adminOrder) {
                console.error('Payment Init - Order EXISTS but is hidden by RLS from current user session')
                return NextResponse.json({
                    error: 'RLS Permission Denied',
                    details: 'Order exists but current session cannot access it. Check RLS policies.'
                }, { status: 403 })
            } else {
                console.error('Payment Init - Order DOES NOT EXIST in database at all')
                return NextResponse.json({ error: 'Order not found in database', orderId }, { status: 404 })
            }
        }

        const restaurant = order.restaurants
        const merchantId = restaurant.freedom_merchant_id
        const secretKey = restaurant.freedom_secret_key

        console.log('Payment Init Debug - Merchant ID:', merchantId ? 'Present' : 'MISSING')
        console.log('Payment Init Debug - Secret Key:', secretKey ? 'Present' : 'MISSING')

        // MOCK MODE: If credentials are missing, allow testing via a mock redirect
        if (!merchantId || !secretKey) {
            console.warn('⚠️ Freedom Pay credentials missing. ENTERING MOCK MODE for testing.');

            // Generate a mock card entry URL to show the user the "card registration/entry" form
            const mockCardUrl = `/checkout/mock-card?orderId=${orderId}&amount=${amount}`;

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
            pg_order_id: orderId,
            pg_description: description || `Order #${orderId}`,
            pg_salt: Math.random().toString(36).substring(7),
            pg_language: 'ru',
            pg_testing_mode: restaurant.freedom_test_mode ? 1 : 0,
            // Webhook and redirect URLs
            pg_result_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
            pg_success_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}?status=success`,
            pg_failure_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}?status=failure`,
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
