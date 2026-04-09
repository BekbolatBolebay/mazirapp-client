'use server'

import nodemailer from 'nodemailer'
import { v4 as uuidv4 } from 'uuid'
import { sign } from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { pb, getPbAdmin } from '@/lib/pocketbase/client'

const JWT_SECRET = process.env.JWT_SECRET || 'mazir_super_secret_jwt_key_2026'

export async function sendCustomOtp(email: string, fullName: string, phone: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    try {
        const adminPb = await getPbAdmin();
        
        // Save OTP to PocketBase
        await adminPb.collection('otp_codes').create({
            email,
            code,
            full_name: fullName,
            phone,
            expires_at: expiresAt.toISOString()
        })

        // Send Email
        if (process.env.MOCK_MAIL === 'true') {
            console.log('--- MAIL MOCK MODE ---')
            console.log(`Target Email: ${email}`)
            console.log(`OTP Code: ${code}`)
            console.log('----------------------')
            return { success: true, mock: true }
        }

        const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER
        const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS
        const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
        const smtpPort = Number(process.env.SMTP_PORT) || 465

        if (!smtpUser || !smtpPass) {
            console.warn('SMTP credentials missing, using mock mode fallback')
            return { success: true, mock: true, message: 'SMTP credentials missing, code logged for development' }
        }

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        })

        await transporter.sendMail({
            from: process.env.SMTP_FROM || `Mazir App <${smtpUser}>`,
            to: email,
            subject: `Mazir App: Растау коды - ${code}`,
            html: `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 40px auto; padding: 40px; border-radius: 24px; background-color: #ffffff; border: 1px solid #eef2f6; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #ff385c 0%, #e31c5f 100%); border-radius: 16px; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; box-shadow: 0 4px 12px rgba(227, 28, 95, 0.2);">
              Mazir App
            </div>
          </div>
          
          <div style="color: #1a1f36; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Сәлеметсіз бе, <b>${fullName}</b>!<br>
            Жүйеге кіру үшін төмендегі растау кодын қолданыңыз:
          </div>
          
          <div style="background: #f8fafc; padding: 32px; text-align: center; font-size: 36px; font-weight: 800; letter-spacing: 8px; border-radius: 20px; color: #ff385c; border: 2px dashed #e2e8f0; margin: 24px 0;">
            ${code}
          </div>
          
          <div style="color: #64748b; font-size: 13px; text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9;">
            Бұл код <b>10 минут</b> ішінде жарамды.<br>
            <span style="color: #94a3b8;">Егер сіз бұл сұранысты жасамасаңыз, бұл хатқа мән бермеңіз.</span>
          </div>
        </div>
      `,
        })

        return { success: true }
    } catch (error: any) {
        console.error('Auth error:', error)
        throw new Error(error.message || 'Қате орын алды')
    }
}

export async function verifyCustomOtp(email: string, code: string) {
    try {
        const adminPb = await getPbAdmin();

        // 1. Check OTP in PocketBase
        const records = await adminPb.collection('otp_codes').getList(1, 1, {
            filter: `email = "${email}" && code = "${code}" && expires_at > "${new Date().toISOString()}"`,
            sort: '-created'
        });

        if (records.items.length === 0) {
            throw new Error('Код қате немесе уақыты өтіп кеткен')
        }

        const otpData = records.items[0]

        // 2. Find or create user in PocketBase
        let user;
        try {
            user = await adminPb.collection('users').getFirstListItem(`email = "${email}"`);
        } catch (e) {
            // User not found, create new
            user = await adminPb.collection('users').create({
                email,
                full_name: otpData.full_name,
                phone: otpData.phone,
                role: 'user',
                emailVisibility: true,
                password: uuidv4(), // Random password for internal auth
                passwordConfirm: uuidv4()
            });
        }

        // 3. Create Session (JWT)
        const token = sign(
            { 
                id: user.id, 
                userId: user.id, 
                email: user.email, 
                role: user.role,
                full_name: user.full_name,
                phone: user.phone
            }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        )

        const cookieStore = await cookies()
        cookieStore.set('mazir_auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/'
        })

        // 4. Delete used OTP
        await adminPb.collection('otp_codes').delete(otpData.id)

        return { success: true, user }
    } catch (error: any) {
        console.error('OTP Verification Error:', error)
        throw new Error(error.message || 'Тексеру кезінде қате кетті')
    }
}

export async function signOut() {
    const cookieStore = await cookies()
    cookieStore.delete('mazir_auth_token')
    return { success: true }
}
