import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { SearchBar } from '@/components/home/search-bar'
import { RestaurantSection } from '@/components/home/restaurant-section'
import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function RestaurantsPage() {
  const supabase = await createClient()

  const { data: allRestaurants } = await supabase
    .from('restaurants')
    .select('*')
    .order('rating', { ascending: false })

  const { data: cafeRestaurants } = await supabase
    .from('restaurants')
    .select('*')
    .contains('cuisine_types', ['Кафе'])
    .order('rating', { ascending: false })

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <Header title="Мәзірлер" />

      <main className="flex-1 overflow-auto">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <SearchBar />

          <Tabs defaultValue="all" className="mt-6">
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
                {allRestaurants && allRestaurants.length > 0 ? (
                  <RestaurantSection restaurants={allRestaurants} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Мейрамханалар табылмады</p>
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
