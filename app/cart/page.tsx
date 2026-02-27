'use client'

import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { CartList } from '@/components/cart/cart-list'
import { CartSummary } from '@/components/cart/cart-summary'
import { useLocalCart } from '@/hooks/use-local-cart'
import { useI18n } from '@/lib/i18n/i18n-context'

export default function CartPage() {
  const cartItems = useLocalCart()
  const { t } = useI18n()

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.menu_item.price * item.quantity,
    0
  )

  const deliveryFee = cartItems.length > 0 ? 500 : 0
  const total = subtotal + deliveryFee

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <Header title={t('cart')} />

      <main className="flex-1 overflow-auto bg-muted/30">
        <div className="max-w-screen-xl mx-auto px-4 py-4 space-y-4">
          {cartItems.length > 0 ? (
            <>
              <CartList items={cartItems} />
              <CartSummary
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                total={total}
                restaurantId={cartItems[0].restaurant_id}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="text-xl font-bold mb-2">{t('cartEmpty')}</h2>
              <p className="text-muted-foreground">
                {t('addItemsToCart')}
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
