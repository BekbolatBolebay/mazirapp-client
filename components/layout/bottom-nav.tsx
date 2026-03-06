'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, UtensilsCrossed, Heart, ShoppingCart, Clock, User } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { useCartCount } from '@/hooks/use-cart-count'
import { useFavoritesCount } from '@/hooks/use-favorites-count'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useI18n()
  const cartCount = useCartCount()
  const favoritesCount = useFavoritesCount()

  // Hide BottomNav on certain pages
  const hideOn = ['/checkout', '/login', '/register', '/booking']
  if (hideOn.some(path => pathname?.startsWith(path))) {
    return null
  }

  const navItems = [
    { href: '/', label: t.common.home, icon: Home },
    { href: '/restaurants', label: t.common.menu, icon: UtensilsCrossed },
    { href: '/favorites', label: t.common.favorites, icon: Heart, badge: favoritesCount },
    { href: '/cart', label: t.common.cart, icon: ShoppingCart, badge: cartCount },
    { href: '/orders', label: 'Тарих', icon: Clock },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 text-[10px] font-medium transition-all relative active:scale-90',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center p-0 text-[10px] leading-none border-2 border-background shadow-sm"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className={cn("leading-none", isActive && "font-bold")}>{item.label}</span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full shadow-[0_0_10px_rgba(var(--primary),0.3)]" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
