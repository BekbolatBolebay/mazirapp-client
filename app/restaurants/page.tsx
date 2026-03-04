import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import Link from 'next/link'
import { SearchBar } from '@/components/home/search-bar'
import { RestaurantSection } from '@/components/home/restaurant-section'
import { createClient } from '@/lib/supabase/server'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MenuItemCard } from '@/components/restaurant/menu-item-card'

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tab?: string }>
}) {
  const { category, tab } = await searchParams
  const supabase = await createClient()

  // ─────────────────────────────────────────────
  // КАТЕГОРИЯ ТАҢДАЛСА → тек тамақтарды шығару
  // ─────────────────────────────────────────────
  if (category) {
    // Категория ID-лерін тап
    const { data: catRows } = await supabase
      .from('categories')
      .select('id')
      .or(`name_kk.eq.${category},name_ru.eq.${category}`)

    let foodQuery = supabase
      .from('menu_items')
      .select('*, restaurants(id, name_ru, name_en, name_kk)')
      .eq('is_available', true)
      .order('sort_order', { ascending: true })
      .limit(60)

    if (catRows && catRows.length > 0) {
      foodQuery = foodQuery.in('category_id', catRows.map(c => c.id))
    }

    const { data: menuItems } = await foodQuery

    return (
      <div className="flex flex-col min-h-screen pb-16">
        <Header title="Тамақтар" />
        <main className="flex-1 overflow-auto">
          <div className="max-w-screen-xl mx-auto px-4 py-4">
            <SearchBar />

            {/* Категория белгісі */}
            <div className="flex items-center justify-between mt-4 mb-5 p-3 bg-primary/5 rounded-xl border border-primary/10">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Категория:</span>
                <span className="text-sm font-bold text-primary">{category}</span>
              </div>
              <Link href="/restaurants">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-primary">
                  <X className="h-4 w-4 mr-1" /> Тазалау
                </Button>
              </Link>
            </div>

            {/* Тамақтар тізімі */}
            {menuItems && menuItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {menuItems.map(item => (
                  <MenuItemCard
                    key={item.id}
                    item={{
                      ...item,
                      restaurant: item.restaurants
                        ? { id: item.restaurants.id, name_ru: item.restaurants.name_ru, name_en: item.restaurants.name_en }
                        : undefined,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">🍽️</div>
                <p className="text-muted-foreground">
                  &quot;{category}&quot; категориясында тамақ табылмады
                </p>
              </div>
            )}
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // КАТЕГОРИЯ ЖОҚ → Барлығы | Кафе | Тамақ tabs
  // ─────────────────────────────────────────────
  const activeTab = tab || 'all'

  const [{ data: restaurants }, { data: menuItems }] = await Promise.all([
    supabase.from('restaurants').select('*').order('rating', { ascending: false }),
    supabase
      .from('menu_items')
      .select('*, restaurants(id, name_ru, name_en, name_kk)')
      .eq('is_available', true)
      .order('sort_order', { ascending: true })
      .limit(60),
  ])

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <Header title="Мәзірлер" />

      <main className="flex-1 overflow-auto">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <SearchBar />

          {/* ── Tabs ── */}
          <div className="flex gap-1 mt-5 mb-5 bg-muted rounded-xl p-1 overflow-x-auto no-scrollbar">
            <Link
              href="/restaurants?tab=all"
              className={`flex-1 min-w-[80px] py-2.5 rounded-lg text-sm font-semibold text-center transition-all ${activeTab === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
            >
              Барлығы
            </Link>
            <Link
              href="/restaurants?tab=cafes"
              className={`flex-1 min-w-[80px] py-2.5 rounded-lg text-sm font-semibold text-center transition-all ${activeTab === 'cafes' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
            >
              Кафе
            </Link>
            <Link
              href="/restaurants?tab=food"
              className={`flex-1 min-w-[80px] py-2.5 rounded-lg text-sm font-semibold text-center transition-all ${activeTab === 'food' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
            >
              Тамақ
            </Link>
          </div>

          {/* All tab */}
          {activeTab === 'all' && (
            <div className="space-y-8">
              {restaurants && restaurants.length > 0 && (
                <RestaurantSection restaurants={restaurants.slice(0, 4)} />
              )}
              {menuItems && menuItems.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Танымал тағамдар</h2>
                    <Link href="/restaurants?tab=food" className="text-sm text-primary font-medium">Көбірек</Link>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {menuItems.slice(0, 10).map(item => (
                      <MenuItemCard
                        key={item.id}
                        item={{
                          ...item,
                          restaurant: item.restaurants
                            ? { id: item.restaurants.id, name_ru: item.restaurants.name_ru, name_en: item.restaurants.name_en }
                            : undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Кафе tab */}
          {activeTab === 'cafes' && (
            restaurants && restaurants.length > 0 ? (
              <RestaurantSection restaurants={restaurants} />
            ) : (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">🏪</div>
                <p className="text-muted-foreground">Кафелер табылмады</p>
              </div>
            )
          )}

          {/* Тамақ tab */}
          {activeTab === 'food' && (
            menuItems && menuItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {menuItems.map(item => (
                  <MenuItemCard
                    key={item.id}
                    item={{
                      ...item,
                      restaurant: item.restaurants
                        ? { id: item.restaurants.id, name_ru: item.restaurants.name_ru, name_en: item.restaurants.name_en }
                        : undefined,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">🍽️</div>
                <p className="text-muted-foreground">Тамақтар табылмады</p>
              </div>
            )
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
