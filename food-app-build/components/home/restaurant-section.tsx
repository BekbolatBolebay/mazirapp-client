'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, Clock } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { FavoriteButton } from '@/components/restaurant/favorite-button'

export function RestaurantSection({ restaurants }: { restaurants: any[] }) {
  const { t, locale } = useI18n()
  const router = useRouter()

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-black text-foreground tracking-tight">
          {locale === 'kk' ? 'Барлық кафелер' : 'Все заведения'}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {restaurants.map((restaurant) => (
          <Card 
            key={restaurant.id} 
            className="overflow-hidden border-none shadow-sm rounded-[2.5rem] group active:scale-[0.98] transition-all bg-white dark:bg-zinc-900 hover:shadow-xl hover:shadow-primary/5"
          >
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row gap-5">
                {/* Image Section */}
                <div className="relative aspect-[16/9] sm:w-48 sm:h-32 shrink-0 rounded-[2rem] overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-inner">
                  <Link href={`/restaurant/${restaurant.id}`} className="block w-full h-full">
                    {restaurant.image_url ? (
                      <Image
                        src={restaurant.image_url}
                        alt={locale === 'ru' ? restaurant.name_ru : restaurant.name_kk}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                        <Star className="w-10 h-10 text-primary/20" />
                      </div>
                    )}
                  </Link>
                  <div className="absolute top-3 right-3 z-10">
                    <FavoriteButton restaurantId={restaurant.id} />
                  </div>
                  {restaurant.is_new && (
                    <div className="absolute top-3 left-3">
                        <Badge className="bg-emerald-500 text-white border-none font-black rounded-lg shadow-lg text-[10px]">
                            NEW
                        </Badge>
                    </div>
                  )}
                </div>

                {/* Info Section */}
                <div className="flex-1 flex flex-col justify-center gap-2 py-1 px-2">
                  <div className="space-y-1">
                    <Link href={`/restaurant/${restaurant.id}`}>
                      <h3 className="font-black text-lg text-foreground truncate group-hover:text-primary transition-colors uppercase">
                        {locale === 'ru' ? restaurant.name_ru : restaurant.name_kk}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                      <span>{(restaurant as any).cuisine_types?.[0] || 'Кафе'}</span>
                      <span className="opacity-30">•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>25-40 мин</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-amber-400/10 px-2 py-1 rounded-xl border border-amber-400/20">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-black text-amber-700 dark:text-amber-400">{restaurant.rating > 0 ? (restaurant.rating).toFixed(1) : '—'}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs font-black text-primary dark:text-primary">
                      <span>{restaurant.delivery_fee === 0 ? (locale === 'kk' ? 'Тегін жеткізу' : 'Бесплатная доставка') : `${restaurant.delivery_fee} ₸`}</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex sm:flex flex-col justify-center sm:pr-4 pt-1 sm:pt-0">
                    <Button
                        className="bg-primary hover:bg-primary/90 text-white rounded-[1.25rem] h-10 sm:h-11 px-6 font-black transition-all active:scale-95 shadow-lg shadow-primary/20 w-full sm:w-auto"
                        onClick={() => router.push(`/restaurant/${restaurant.id}`)}
                    >
                        {locale === 'kk' ? 'Тапсырыс' : 'Заказать'}
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
