import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
        }

        // 1. Find user (qualified with public. schema)
        const res = await query('SELECT * FROM public.users WHERE email = $1', [email.toLowerCase()])
        const user = res.rows[0]

        if (!user) {
            console.log('[Login] User not found:', email)
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // 2. Check password
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            console.log('[Login] Password mismatch for:', email)
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // 3. Get Restaurant ID
        console.log('[Login] Success, finding restaurant for user.id:', user.id)
        const cafeRes = await query('SELECT id FROM public.restaurants WHERE owner_id = $1 LIMIT 1', [user.id])
        const restaurant_id = cafeRes.rows[0]?.id || null
        console.log('[Login] Found restaurant_id:', restaurant_id)

        // 4. Create JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                userId: user.id, // Compatibility
                email: user.email, 
                role: user.role,
                name: user.name,
                restaurant_id
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        )

        // 4. Set Cookie
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
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        })

    } catch (error: any) {
        console.error('Login API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
