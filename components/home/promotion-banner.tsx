'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Database } from '@/lib/supabase/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Promotion = Database['public']['Tables']['promotions']['Row']

export function PromotionBanner({ promotions }: { promotions: Promotion[] }) {
  const { locale } = useI18n()
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (promotions.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [promotions.length])

  if (!promotions || promotions.length === 0) return null

  const currentPromo = promotions[currentIndex]

  return (
    <div className="relative">
      <Card className="relative overflow-hidden h-32 bg-gradient-to-r from-primary to-accent border-0">
        {currentPromo.image_url && (
          <div className="absolute inset-0">
            <Image
              src={currentPromo.image_url}
              alt={locale === 'ru' && currentPromo.title_ru ? currentPromo.title_ru : currentPromo.title}
              fill
              className="object-cover opacity-20"
            />
          </div>
        )}
        
        <div className="relative z-10 flex items-center justify-between h-full p-4">
          <div className="flex-1">
            <Badge className="mb-2 bg-white/20 text-white border-white/30 backdrop-blur">
              {currentPromo.discount_percent && `-${currentPromo.discount_percent}% жеңілдік`}
            </Badge>
            <h3 className="text-white text-lg font-bold mb-1">
              {locale === 'ru' && currentPromo.title_ru ? currentPromo.title_ru : currentPromo.title}
            </h3>
            <p className="text-white/90 text-sm">
              {locale === 'ru' && currentPromo.description_ru ? currentPromo.description_ru : currentPromo.description}
            </p>
          </div>
          
          <div className="relative w-20 h-20 rounded-full bg-accent ml-4">
            {/* Decorative circle */}
          </div>
        </div>
      </Card>

      {promotions.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {promotions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-6 bg-primary'
                  : 'w-1.5 bg-muted'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
