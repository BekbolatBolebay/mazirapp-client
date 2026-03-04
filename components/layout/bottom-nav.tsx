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

  const navItems = [
    { href: '/', label: t.common.home, icon: Home },
    { href: '/restaurants', label: t.common.menu, icon: UtensilsCrossed },
    { href: '/favorites', label: t.common.favorites, icon: Heart, badge: favoritesCount },
    { href: '/cart', label: t.common.cart, icon: ShoppingCart, badge: cartCount },
    { href: '/orders', label: 'Тарих', icon: Clock },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors relative',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 min-w-5 h-5 flex items-center justify-center p-0 text-[10px] leading-none"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className="leading-none">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
