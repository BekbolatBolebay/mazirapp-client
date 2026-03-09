'use server'

import nodemailer from 'nodemailer'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database } from '@/lib/supabase/types'

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

export async function sendCustomOtp(email: string, fullName: string, phone: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

    const supabase = createAdminClient()

    // Save OTP to DB
    const { error: dbError } = await (supabase
        .from('otp_codes') as any)
        .insert({
            email,
            code,
            full_name: fullName,
            phone,
            expires_at: expiresAt
        })

    if (dbError) {
        console.error('Error saving OTP:', dbError)
        throw new Error('Қате орын алды. Қайта көріңіз.')
    }

    // Send Email
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: email,
            subject: `Mazir App: Растау коды - ${code}`,
            html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #ff385c; text-align: center;">Mazir App</h2>
          <p>Сәлеметсіз бе, <b>${fullName}</b>!</p>
          <p>Сіздің тіркелу немесе жүйеге кіру кодыңыз:</p>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px;">
            ${code}
          </div>
          <p style="font-size: 12px; color: #888; margin-top: 20px;">
            Бұл код 10 минут ішінде жарамды. Егер сіз бұл сұранысты жасамасаңыз, бұл хатқа мән бермеңіз.
          </p>
        </div>
      `,
        })
    } catch (emailError) {
        console.error('Error sending email:', emailError)
        throw new Error('Почта жіберу мүмкін болмады.')
    }

    return { success: true }
}

export async function verifyCustomOtp(email: string, code: string) {
    const supabase = createAdminClient()

    // 1. Check OTP in our table
    const { data: otpData, error: otpError } = await (supabase
        .from('otp_codes') as any)
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (otpError || !otpData) {
        throw new Error('Код қате немесе уақыты өтіп кеткен')
    }

    // 2. Use Supabase Admin to create/sign in the user
    const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
            data: {
                full_name: (otpData as any).full_name,
                phone: (otpData as any).phone
            }
        }
    })

    if (authError) {
        console.error('Auth magic link error:', authError)
        throw new Error('Жүйеге кіру кезінде қате шықты')
    }

    // 3. Delete the used OTP code
    await (supabase.from('otp_codes') as any).delete().eq('id', (otpData as any).id)

    // Return the properties needed for the client to complete sign in
    return {
        token_hash: authData.properties.hashed_token,
        email: email
    }
}
