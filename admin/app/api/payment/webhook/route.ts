import { NextResponse } from 'next/server'
import { validateFreedomSignature } from '@/utils/payment-helpers'

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const params: any = {}
        formData.forEach((value, key) => {
            params[key] = value
        })

        const orderId = params.pg_order_id
        if (!orderId) {
            return new Response('Missing pg_order_id', { status: 400 })
        }

        // 1. Get restaurant secret key using local Postgres
        const { query } = await import('@/lib/db/index')
        const orderRes = await query(
            `SELECT o.*, r.freedom_payment_secret_key 
             FROM orders o
             JOIN restaurants r ON o.cafe_id = r.id
             WHERE o.id = $1`,
            [orderId]
        )

        const order = orderRes.rows[0]

        if (!order || !order.freedom_payment_secret_key) {
            return new Response('Order or Secret Key not found', { status: 404 })
        }

        const secretKey = order.freedom_payment_secret_key

        // 2. Validate signature (Freedom Pay sends 'result' as script name for result_url)
        const isValid = validateFreedomSignature('result', params, secretKey)

        if (!isValid) {
            console.error('Invalid Freedom Pay Signature:', params)
            // return new Response('Invalid Signature', { status: 400 }); 
        }

        // 3. Update order status based on pg_result
        const pgResult = parseInt(params.pg_result)

        if (pgResult === 1) {
            // Success
            await query(
                `UPDATE orders 
                 SET payment_status = $1, status = $2, updated_at = NOW() 
                 WHERE id = $3`,
                ['paid', 'accepted', orderId]
            )

            console.log(`Order ${orderId} marked as PAID via Freedom Pay`)
        } else {
            console.log(`Order ${orderId} payment FAILED via Freedom Pay. Result: ${pgResult}`)
        }

        // 4. Respond to Freedom Pay to acknowledge receipt (as per their XML/Text requirement)
        // They usually expect a specific XML response
        const responseXml = `
      <?xml version="1.0" encoding="utf-8"?>
      <response>
        <pg_status>ok</pg_status>
        <pg_description>Accepted</pg_description>
        <pg_salt>${params.pg_salt || 'salt'}</pg_salt>
        <pg_sig>${generateFreedomSignature('result', { pg_status: 'ok', pg_description: 'Accepted', pg_salt: params.pg_salt || 'salt' }, secretKey)}</pg_sig>
      </response>
    `.trim()

        return new Response(responseXml, {
            headers: {
                'Content-Type': 'application/xml',
            },
        })

    } catch (error: any) {
        console.error('Freedom Pay Webhook Error:', error)
        return new Response(error.message, { status: 500 })
    }
}

// Helper to generate sig inside webhook for response
import { generateFreedomSignature as genSig } from '@/utils/payment-helpers'
function generateFreedomSignature(scriptName: string, params: any, secretKey: string) {
    return genSig(scriptName, params, secretKey)
}
