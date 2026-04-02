import { NextResponse, type NextRequest } from 'next/server'
import pb from '@/utils/pocketbase'

export async function updateSession(request: NextRequest) {
  // 1. Load the auth store from cookie
  const cookieHeader = request.headers.get('cookie') || ''
  pb.authStore.loadFromCookie(cookieHeader)

  try {
    // 2. Refresh the session if needed (optional for middleware speed, but good for security)
    if (pb.authStore.isValid) {
        await pb.collection('users').authRefresh()
    }
  } catch (e) {
    pb.authStore.clear()
  }

  // 3. Define protected and public routes
  const user = pb.authStore.model
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register')
  const isCourierPage = request.nextUrl.pathname.startsWith('/courier')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')

  // 4. Handle Redirections
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

  // 5. Export back the refreshed cookie if needed
  const response = NextResponse.next({
    request,
  })

  // Synchronize pb auth store changes with response cookies
  response.headers.set('set-cookie', pb.authStore.exportToCookie({ httpOnly: false }))

  return response
}
