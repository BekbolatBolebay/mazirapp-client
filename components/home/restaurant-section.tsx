'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, Clock } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Database } from '@/lib/supabase/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { FavoriteButton } from '@/components/restaurant/favorite-button'

type Restaurant = Database['public']['Tables']['restaurants']['Row']

export function RestaurantSection({ restaurants }: { restaurants: Restaurant[] }) {
  const { t, locale } = useI18n()

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{t.home.newRestaurants}</h2>
        <Link href="/restaurants" className="text-sm text-primary font-medium">
          {t.home.allRestaurants}
        </Link>
      </div>

      <div className="space-y-4">
        {restaurants.map((restaurant) => (
          <div key={restaurant.id} className="relative">
            <Link href={`/restaurant/${restaurant.id}`}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative h-40 bg-muted">
                  {restaurant.image_url || restaurant.banner_url ? (
                    <Image
                      src={restaurant.image_url || restaurant.banner_url || ''}
                      alt={locale === 'ru' ? restaurant.name_ru : restaurant.name_kk}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
                      <div className="relative">
                        <Star className="w-8 h-8 text-primary/10 fill-primary/5" />
                        <div className="absolute inset-0 blur-xl bg-primary/10 -z-10" />
                      </div>
                      <span className="mt-2 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">Məzir</span>
                    </div>
                  )}
                  {restaurant.is_open && (
                    <Badge className="absolute top-3 left-3 bg-white text-primary border-0">
                      {t.restaurant.open}
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-base mb-1">
                        {locale === 'ru' ? restaurant.name_ru : restaurant.name_kk}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {locale === 'ru' ? restaurant.description_ru : restaurant.description_kk}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Star className="w-4 h-4 fill-accent text-accent" />
                      <span className="text-sm font-medium">{(restaurant.rating || 0).toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {restaurant.delivery_time_min || 30}-{restaurant.delivery_time_max || 45} {t.restaurant.deliveryTime}
                      </span>
                    </div>
                    {restaurant.delivery_fee === 0 ? (
                      <span className="text-accent font-medium">{t.restaurant.free}</span>
                    ) : (
                      <span>{restaurant.delivery_fee}₸</span>
                    )}
                  </div>

                  {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {restaurant.cuisine_types.slice(0, 3).map((category, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
            <div className="absolute top-3 right-3 z-10">
              <FavoriteButton restaurantId={restaurant.id} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
