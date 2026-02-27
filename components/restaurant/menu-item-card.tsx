'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { addToLocalCart, LocalCartItem } from '@/lib/storage/local-storage'
import { Database } from '@/lib/supabase/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type MenuItem = Database['public']['Tables']['menu_items']['Row'] & {
  restaurant?: {
    name_ru: string
    name_en: string
  }
}

export function MenuItemCard({ item }: { item: MenuItem }) {
  const { locale, t } = useI18n()
  const [loading, setLoading] = useState(false)

  const addToCart = () => {
    setLoading(true)

    try {
      const cartItem: LocalCartItem = {
        id: `cart_${Date.now()}_${item.id}`,
        menu_item_id: item.id,
        restaurant_id: item.restaurant_id,
        quantity: 1,
        menu_item: {
          name_ru: item.name_ru || item.name,
          name_en: item.name,
          price: item.price,
          image_url: item.image_url || '',
          restaurant: {
            name_ru: item.restaurant?.name_ru || '',
            name_en: item.restaurant?.name_en || ''
          }
        }
      }

      addToLocalCart(cartItem)
      toast.success(t('addedToCart'))
    } catch (error) {
      console.error('[v0] Error adding to cart:', error)
      toast.error(t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-square bg-muted">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={locale === 'ru' && item.name_ru ? item.name_ru : item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}
      </div>

      <CardContent className="p-3">
        <h3 className="font-semibold text-sm mb-1 line-clamp-2 min-h-[2.5rem]">
          {locale === 'ru' && item.name_ru ? item.name_ru : item.name}
        </h3>

        {item.description && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {locale === 'ru' && item.description_ru ? item.description_ru : item.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-primary font-bold">
            {item.price.toFixed(0)}₸
          </span>
          <Button
            size="icon"
            className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
            onClick={addToCart}
            disabled={loading || !item.is_available}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
