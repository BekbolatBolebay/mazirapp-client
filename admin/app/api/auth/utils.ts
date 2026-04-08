import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'mazir_secret_key_123'
)

export async function verifyAuth(req: NextRequest) {
    const token = req.cookies.get('mazir_auth_token')?.value

    if (!token) return null

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return payload as { id: string; email: string; role: string }
    } catch (err) {
        return null
    }
}
