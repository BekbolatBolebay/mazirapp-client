import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { RestaurantSection } from '@/components/home/restaurant-section'

export default async function FavoritesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: favorites } = await supabase
    .from('favorites')
    .select('*, restaurants(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const restaurants = favorites?.map((fav) => fav.restaurants).filter(Boolean) || []

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <Header title="Таңдаулар" />

      <main className="flex-1 overflow-auto bg-muted/30">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          {restaurants.length > 0 ? (
            <RestaurantSection restaurants={restaurants as any} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4">❤️</div>
              <h2 className="text-xl font-bold mb-2">Таңдаулар бос</h2>
              <p className="text-muted-foreground mb-4">
                Сүйікті мейрамханаларыңызды қосыңыз
              </p>
              <Link href="/" className="text-primary font-medium">
                Мейрамханаларды қарау
              </Link>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
