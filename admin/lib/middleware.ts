import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const secret = new TextEncoder().encode(JWT_SECRET)

export async function updateSession(request: NextRequest) {
  const token = request.cookies.get('mazir_auth_token')?.value
  let user = null

  if (token) {
    try {
        const { payload } = await jwtVerify(token, secret)
        user = payload
    } catch (e) {
        // Token invalid or expired
    }
  }

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register')
  const isCourierPage = request.nextUrl.pathname.startsWith('/courier')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')

  // Handle Redirections
  if (!user && !isAuthPage && !isApiRoute && !isCourierPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
