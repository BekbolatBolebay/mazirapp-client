import { NextRequest } from 'next/server'
import { verifyAdmin, createAdminResponse, createAdminError } from '@/lib/auth/admin'

export async function POST(req: NextRequest) {
    const { authorized } = await verifyAdmin()
    if (!authorized) {
        return createAdminError('Unauthorized', 403)
    }

    try {
        const body = await req.json()
        const { clients } = body

        if (!clients || !Array.isArray(clients)) {
            return createAdminError('Invalid clients data', 400)
        }

        const { query } = await import('@/lib/db')
        let successCount = 0
        const errors = []

        for (const client of clients) {
            const { email, full_name, phone } = client

            if (!email) {
                errors.push(`Missing email for client: ${full_name || 'Unknown'}`)
                continue
            }

            try {
                // Check if user already exists
                const existingRes = await query(
                    'SELECT id FROM public.users WHERE email = $1',
                    [email]
                )

                if (existingRes.rows.length > 0) {
                    // Update existing user info
                    await query(
                        `UPDATE public.users 
                         SET full_name = COALESCE($1, full_name), 
                             phone = COALESCE($2, phone),
                             updated_at = NOW()
                         WHERE email = $3`,
                        [full_name || null, phone || null, email]
                    )
                    successCount++
                } else {
                    // Insert new user
                    await query(
                        `INSERT INTO public.users (email, full_name, phone, role) 
                         VALUES ($1, $2, $3, 'user')`,
                        [email, full_name || null, phone || null]
                    )
                    successCount++
                }
            } catch (err: any) {
                errors.push(`Error processing ${email}: ${err.message}`)
            }
        }

        return createAdminResponse({
            success: true,
            count: successCount,
            total: clients.length,
            errors: errors.length > 0 ? errors : undefined
        })

    } catch (error: any) {
        return createAdminError(error.message, 500)
    }
}
