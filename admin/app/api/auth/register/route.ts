import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            email,
            password,
            cafeName,
            address,
            whatsapp,
            latitude,
            longitude,
            openTime,
            closeTime,
            selectedDays
        } = body

        // 1. Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // 2. Create User via SQL
        const userRes = await query(
            'INSERT INTO public.users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id',
            [email, hashedPassword, cafeName, 'admin']
        )
        const userId = userRes.rows[0].id

        // 3. Create Restaurant
        const cafeRes = await query(
            `INSERT INTO public.restaurants (
                name_kk, name_ru, name_en, address, phone, owner_id, 
                status, is_open, latitude, longitude
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
            [cafeName, cafeName, cafeName, address, whatsapp, userId, 'open', true, latitude, longitude]
        )
        const cafeId = cafeRes.rows[0].id

        // 4. Create Default Working Hours
        const days = [0, 1, 2, 3, 4, 5, 6]
        for (const day of days) {
            await query(
                `INSERT INTO public.working_hours (cafe_id, day_of_week, open_time, close_time, is_day_off) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [cafeId, day, openTime, closeTime, !selectedDays.includes(day)]
            )
        }

        // 5. Create JWT for auto-login
        const token = jwt.sign(
            { 
                id: userId,
                userId, 
                email, 
                role: 'admin',
                name: cafeName,
                restaurant_id: cafeId
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        )

        // 6. Set Cookie
        const cookieStore = await cookies()
        cookieStore.set('mazir_auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/',
        })

        return NextResponse.json({
            success: true,
            message: 'Registration successful',
            user: {
                id: userId,
                email,
                name: cafeName,
                role: 'admin'
            }
        })

    } catch (error: any) {
        console.error('Registration API Error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
