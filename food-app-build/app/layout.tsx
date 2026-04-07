import type { Metadata, Viewport } from 'next'
const fontStack = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/lib/auth/auth-context'
import { I18nProvider } from '@/lib/i18n/i18n-context'
import { Toaster } from '@/components/ui/sonner'
import { BottomNav } from '@/components/layout/bottom-nav'
import { OrderStatusListener } from '@/components/notifications/order-status-listener'
import { FCMHandler } from '@/components/fcm-handler'
import './globals.css'


export const metadata: Metadata = {
  title: 'Məzir APP - Food Delivery',
  description: 'Order food from your favorite restaurants',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Məzir',
    startupImage: [
      {
        url: '/apple-touch-icon.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/favicon-32x32.png',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
}

import { InstallPrompt } from '@/components/pwa/install-prompt'
import { PushPrompt } from '@/components/pwa/push-prompt'
import { CartBar } from '@/components/restaurant/cart-bar'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ fontFamily: fontStack }}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <I18nProvider>
              {children}
              <InstallPrompt />
              <PushPrompt />
              <BottomNav />
              <CartBar />
              <OrderStatusListener />
              <FCMHandler />
              <Toaster position="top-center" duration={2 * 1000} />
            </I18nProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
