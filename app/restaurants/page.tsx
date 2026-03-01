import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import Link from 'next/link'
import { SearchBar } from '@/components/home/search-bar'
import { RestaurantSection } from '@/components/home/restaurant-section'
import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function RestaurantsPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('restaurants')
    .select('*')
    .order('rating', { ascending: false })

  if (category) {
    query = query.contains('cuisine_types', [category])
  }

  const { data: allRestaurants } = await query

  const cafeRestaurants = allRestaurants?.filter(r =>
    r.cuisine_types && r.cuisine_types.includes('Кафе')
  ) || []

  const foodRestaurants = allRestaurants?.filter(r =>
    !r.cuisine_types || !r.cuisine_types.includes('Кафе')
  ) || []

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <Header title="Мәзірлер" />

      <main className="flex-1 overflow-auto">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <SearchBar />

          {category && (
            <div className="flex items-center justify-between mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground transition-colors line-clamp-1">Категория:</span>
                <span className="text-sm font-bold text-primary">{category}</span>
              </div>
              <Link href="/restaurants">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-primary">
                  <X className="h-4 w-4 mr-1" />
                  Тазалау
                </Button>
              </Link>
            </div>
          )}

          <Tabs defaultValue="all" className={category ? "mt-4" : "mt-6"}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="all">Барлығы</TabsTrigger>
              <TabsTrigger value="cafes">Кафе</TabsTrigger>
              <TabsTrigger value="food">Тамақ</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="all">
                {allRestaurants && allRestaurants.length > 0 ? (
                  <RestaurantSection restaurants={allRestaurants} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Мейрамханалар табылмады</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cafes">
                {cafeRestaurants && cafeRestaurants.length > 0 ? (
                  <RestaurantSection restaurants={cafeRestaurants} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Кафелер табылмады</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="food">
                {foodRestaurants && foodRestaurants.length > 0 ? (
                  <RestaurantSection restaurants={foodRestaurants} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Тағамдар табылмады</p>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
