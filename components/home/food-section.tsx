'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, Plus } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { addToLocalCart, LocalCartItem } from '@/lib/storage/local-storage'
import { Database } from '@/lib/supabase/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FavoriteButton } from '@/components/restaurant/favorite-button'

type MenuItem = Database['public']['Tables']['menu_items']['Row'] & {
  restaurants: Database['public']['Tables']['restaurants']['Row'] | null
}

export function FoodSection({ title, items }: { title: string; items: MenuItem[] }) {
  const { t, locale } = useI18n()

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{title}</h2>
        <Link href="/restaurants" className="text-sm text-primary font-medium">
          {t.home.allFood}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <Link key={item.id} href={`/restaurant/${item.restaurant_id}`}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
              <div className="relative aspect-square bg-muted">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={locale === 'ru' ? item.name_ru : item.name_kk}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                    No image
                  </div>
                )}
                <div className="absolute top-2 right-2 z-10">
                  <FavoriteButton menuItemId={item.id} />
                </div>
              </div>

              <CardContent className="p-3">
                <h3 className="font-semibold text-sm mb-1 line-clamp-1">
                  {locale === 'ru' ? item.name_ru : item.name_kk}
                </h3>

                {item.restaurants && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                    {locale === 'ru' ? item.restaurants.name_ru : item.restaurants.name_kk}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-primary font-bold">
                    {item.price.toFixed(0)}₸
                  </span>
                  <Button
                    size="icon"
                    className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
                    onClick={(e) => {
                      e.preventDefault()
                      try {
                        const cartItem: LocalCartItem = {
                          id: `cart_${Date.now()}_${item.id}`,
                          menu_item_id: item.id,
                          restaurant_id: item.restaurant_id,
                          quantity: 1,
                          menu_item: {
                            name_ru: item.name_ru,
                            name_en: item.name_en,
                            price: item.price,
                            image_url: item.image_url || '',
                            restaurant: {
                              name_ru: item.restaurants?.name_ru || '',
                              name_en: item.restaurants?.name_en || ''
                            }
                          }
                        }
                        addToLocalCart(cartItem)
                        import('sonner').then(({ toast }) => toast.success(t('cart.addToCart') || 'Қосылды'))
                      } catch (error) {
                        console.error('Error adding to cart:', error)
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
