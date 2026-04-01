'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/hooks/use-cart'
import { ShoppingBag, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/lib/i18n/i18n-context'
import { cn } from '@/lib/utils'

export function CartBar() {
  const pathname = usePathname()
  const { totalCount, totalPrice, cart } = useCart()
  const { locale } = useI18n()

  // Only show CartBar on restaurant pages
  const isRestaurantPage = pathname?.startsWith('/restaurant/')
  if (!isRestaurantPage || !pathname) return null

  // Extract cafe_id from pathname
  const cafeIdFromUrl = pathname.split('/')[2]

  // Only show if cart items belong to this cafe
  const isCorrectRestaurant = !!cafeIdFromUrl && cart.some(item => item.cafe_id === cafeIdFromUrl)

  const hasItems = totalCount > 0
  if (!hasItems || !isCorrectRestaurant) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={cn(
          "fixed bottom-6 left-4 right-4 z-[999] max-w-lg mx-auto transition-all duration-300"
        )}
      >
        <Link href="/cart">
          <div className="bg-primary text-primary-foreground rounded-2xl p-4 shadow-2xl shadow-primary/40 flex items-center justify-between active:scale-[0.98] transition-all border border-white/20 backdrop-blur-lg">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-xl p-2">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 leading-none mb-1">
                  {locale === 'kk' ? 'Себетте' : 'В корзине'}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black leading-none">{totalPrice.toLocaleString()} ₸</span>
                  <span className="text-xs opacity-60">• {totalCount} {locale === 'kk' ? 'тағам' : 'блюдо'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 font-black text-sm group">
              <span>{locale === 'kk' ? 'СЕБЕТКЕ ӨТУ' : 'В КОРЗИНУ'}</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </motion.div>
    </AnimatePresence>
  )
}
