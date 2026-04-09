import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generateFreedomSignature } from '@/utils/payment-helpers'
import { getPbAdmin } from '@/lib/pocketbase/client'

export async function POST(req: Request) {
    try {
        const { orderId, reservationId, amount, description, customerEmail, customerPhone } = await req.json()

        if ((!orderId && !reservationId) || !amount) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
        }

        const adminPb = await getPbAdmin()
        
        let record: any = null
        let restaurant: any = null
        let finalId = orderId || reservationId

        // 1. Тапсырысты немесе Брондауды PocketBase-тен алу (Sensitive Data)
        try {
            if (orderId) {
                record = await adminPb.collection('orders').getOne(orderId, {
                    expand: 'cafe_id'
                });
                restaurant = record.expand.cafe_id;
            } else if (reservationId) {
                record = await adminPb.collection('reservations').getOne(reservationId, {
                    expand: 'cafe_id'
                });
                restaurant = record.expand.cafe_id;
            }
        } catch (e) {
            return NextResponse.json({ error: 'Order or Reservation not found' }, { status: 404 })
        }

        if (!restaurant) {
            return NextResponse.json({ error: 'Restaurant details not found' }, { status: 500 })
        }

        // Әр мейрамхананың жеке кілттері (PocketBase-те сақталады)
        const merchantId = restaurant.freedom_merchant_id;
        const secretKey = restaurant.freedom_payment_secret_key;

        // MOCK MODE: Егер кілттер жоқ болса, тексеру режиміне жіберу
        if (!merchantId || !secretKey) {
            console.warn('⚠️ Freedom Pay credentials missing for this restaurant.');
            const mockCardUrl = `/checkout/mock-card?${orderId ? `orderId=${orderId}` : `reservationId=${reservationId}`}&amount=${amount}`;
            return NextResponse.json({
                redirectUrl: mockCardUrl,
                isMock: true,
                message: 'Demo mode: Please configure Freedom Pay keys in Admin panel.'
            })
        }

        // 2. Freedom Pay параметрлерін дайындау
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

        // Пайдаланушы мәліметтері
        if (customerEmail) params.pg_user_contact_email = customerEmail
        if (customerPhone) params.pg_user_phone = customerPhone

        // Фискализация (чек) деректерін қосу
        try {
            const items = await adminPb.collection(orderId ? 'order_items' : 'reservation_items').getFullList({
                filter: `${orderId ? 'order_id' : 'reservation_id'} = "${finalId}"`
            });

            if (items.length > 0) {
                const receiptData = items.map((item: any) => ({
                    name: item.name_ru || 'Item',
                    count: item.quantity || 1,
                    price: item.price,
                    type: 'service',
                    vat_percent: 0,
                }))

                if (orderId && record.delivery_fee > 0) {
                    receiptData.push({
                        name: 'Доставка',
                        count: 1,
                        price: record.delivery_fee,
                        type: 'service',
                        vat_percent: 0
                    })
                }
                params.pg_receipt_data = JSON.stringify(receiptData)
            }
        } catch (e) {
            console.error('Fiscalization data error:', e);
        }

        // Қол қою (Signature) - Мейрамхананың жеке Secret Key-імен
        const sig = generateFreedomSignature('init_payment.php', params, secretKey)
        params.pg_sig = sig

        // Freedom Pay-ге сұраныс жіберу
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
            // Тапсырысқа төлем сілтемесін жаңарту
            await adminPb.collection(orderId ? 'orders' : 'reservations').update(finalId, {
                payment_url: redirectUrl
            });
            
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
