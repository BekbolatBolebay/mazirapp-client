import { notFound } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Heart, Star, Clock, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MenuItemCard } from '@/components/restaurant/menu-item-card'
import { FavoriteButton } from '@/components/restaurant/favorite-button'

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single()

  if (!restaurant) {
    notFound()
  }

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', id)
    .eq('is_available', true)
    .order('category', { ascending: true })

  const categories = [...new Set(menuItems?.map((item) => item.category) || [])]

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <div className="relative h-48 bg-muted">
        {restaurant.cover_image_url && (
          <Image
            src={restaurant.cover_image_url}
            alt={restaurant.name}
            fill
            className="object-cover"
          />
        )}

        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
          <Link href="/">
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full bg-background/80 backdrop-blur hover:bg-background/90"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          <FavoriteButton restaurantId={id} />
        </div>

        {restaurant.is_open ? (
          <Badge className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white text-primary border-0">
            Ашық • {restaurant.working_hours || '08:00 - 22:00'}
          </Badge>
        ) : (
          <Badge className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground border-0">
            Жабық
          </Badge>
        )}
      </div>

      <main className="flex-1 overflow-auto bg-background">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-2xl font-bold">{restaurant.name}</h1>
              <div className="flex items-center gap-1 ml-2">
                <Star className="w-5 h-5 fill-accent text-accent" />
                <span className="text-lg font-bold">{restaurant.rating.toFixed(1)}</span>
              </div>
            </div>

            {restaurant.description && (
              <p className="text-muted-foreground mb-3">{restaurant.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>
                  {restaurant.delivery_time_min}-{restaurant.delivery_time_max} мин
                </span>
              </div>
              {restaurant.delivery_fee === 0 ? (
                <span className="text-accent font-medium">Тегін жеткізу</span>
              ) : (
                <span>Жеткізу: {restaurant.delivery_fee}₸</span>
              )}
            </div>

            {restaurant.address && (
              <div className="flex items-start gap-2 text-sm mb-3">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{restaurant.address}</span>
              </div>
            )}

            {restaurant.phone && (
              <Button
                variant="outline"
                className="w-full justify-center gap-2"
                asChild
              >
                <a href={`tel:${restaurant.phone}`}>
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-primary font-medium">Кафемен байланысу</span>
                </a>
              </Button>
            )}
          </div>

          {restaurant.categories && restaurant.categories.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {restaurant.categories.map((category, index) => (
                <Badge key={index} variant="secondary">
                  {category}
                </Badge>
              ))}
            </div>
          )}

          <Tabs defaultValue={categories[0] || 'all'} className="w-full">
            <TabsList className="w-full justify-start gap-2 h-auto p-1 bg-muted/50 overflow-x-auto">
              <TabsTrigger value="all" className="rounded-lg">
                Барлығы
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category} value={category} className="rounded-lg whitespace-nowrap">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <div className="grid grid-cols-2 gap-3">
                {menuItems?.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </TabsContent>

            {categories.map((category) => (
              <TabsContent key={category} value={category} className="mt-4">
                <div className="grid grid-cols-2 gap-3">
                  {menuItems
                    ?.filter((item) => item.category === category)
                    .map((item) => (
                      <MenuItemCard key={item.id} item={item} />
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
