'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Database } from '@/lib/supabase/types'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'

type Promotion = Database['public']['Tables']['promotions']['Row']

export function PromotionBanner({ promotions }: { promotions: Promotion[] }) {
  const { locale } = useI18n()
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (promotions.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [promotions.length])

  if (!promotions || promotions.length === 0) return null

  return (
    <div className="relative group">
      <div className="relative h-40 w-full overflow-hidden rounded-[2.5rem] shadow-xl shadow-primary/5 border border-white/10">
        <AnimatePresence mode="wait">
          {promotions.map((promo, index) => (
            index === currentIndex && (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute inset-0"
              >
                {/* Background Gradient & Image */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1e1e1e] via-[#111] to-[#000]">
                  {promo.image_url && (
                    <Image
                      src={promo.image_url}
                      alt={promo.title}
                      fill
                      className="object-cover opacity-20 mix-blend-overlay"
                    />
                  )}
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-[-10%] right-[-5%] w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-5%] w-32 h-32 bg-primary/20 rounded-full blur-2xl" />

                <div className="relative h-full flex items-center justify-between p-7 text-white">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md font-black rounded-lg text-[10px]">
                        {promo.discount_percent ? `-${promo.discount_percent}% OFF` : 'SPECIAL'}
                      </Badge>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                        Limited Time
                      </span>
                    </div>
                    <h3 className="text-2xl font-black tracking-tight leading-tight max-w-[200px] uppercase">
                      {locale === 'ru' && promo.title_ru ? promo.title_ru : promo.title}
                    </h3>
                  </div>

                  <div className="relative flex flex-col items-center gap-2">
                    <div className="w-20 h-20 rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl rotate-3">
                      <div className="text-4xl drop-shadow-2xl">🎁</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>

      {promotions.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {promotions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                index === currentIndex 
                ? 'w-8 bg-primary dark:bg-primary' 
                : 'w-2 bg-zinc-200 dark:bg-zinc-800'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
