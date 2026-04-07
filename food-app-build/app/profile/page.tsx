import { query } from '@/lib/db'
import ProfileClient from './profile-client'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export default async function ProfilePage() {
    const cookieStore = await cookies()
    const token = cookieStore.get('mazir_auth_token')?.value

    if (!token) {
        redirect('/login')
    }

    let userId: string
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        userId = decoded.userId
    } catch (err) {
        redirect('/login')
    }

    // Fetch user profile
    const userRes = await query('SELECT * FROM users WHERE id = $1', [userId])
    const user = userRes.rows[0]

    if (!user) {
        redirect('/login')
    }

    // Check if user is anonymous (guest)
    if (user.role === 'guest') {
        redirect('/login?next=/profile')
    }

    const profile = user

    const restaurantRes = await query(
        'SELECT * FROM restaurants WHERE owner_id = $1 LIMIT 1',
        [userId]
    )
    const restaurant = restaurantRes.rows[0] || null

    return <ProfileClient user={user} profile={profile} restaurant={restaurant} />
}
