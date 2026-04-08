import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'mazir_secret_key_123'
)

export async function getAdminSession() {
    const cookieStore = await cookies()
    const token = cookieStore.get('mazir_auth_token')?.value

    if (!token) return null

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return payload as { id: string; email: string; role: string; restaurant_id: string }
    } catch (err) {
        return null
    }
}
