export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import Link from 'next/link'
import { SearchBar } from '@/components/home/search-bar'
import { RestaurantSection } from '@/components/home/restaurant-section'
import pb from '@/utils/pocketbase'
import { X, Search, Store, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MenuItemCard } from '@/components/restaurant/menu-item-card'
import { FilterDrawer } from '@/components/restaurants/filter-drawer'
import { Badge } from '@/components/ui/badge'

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    tab?: string;
    city?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    restaurantId?: string;
    q?: string;
  }>
}) {
  const { category, tab, city, minPrice, maxPrice, sort, restaurantId, q } = await searchParams

  // 1. Fetch Filter Data
  const [categories, restaurantsList] = await Promise.all([
    pb.collection('categories').getFullList({ sort: 'sort_order' }),
    pb.collection('restaurants').getFullList({ fields: 'id, city, name_ru, name_kk' })
  ])

  // Deduplicate categories by name
  const allCategories = Array.from(new Map(categories?.map(c => [c.name_ru, c]) || []).values())
  const uniqueCities = Array.from(new Set(restaurantsList?.map(r => r.city).filter(Boolean) || []))

  // 2. Handle Filtered View (Category, Price, etc.)
  if (category || minPrice || maxPrice || restaurantId || (tab === 'food' && sort)) {
    let filterParts = ['is_available = true']
    
    if (category) {
        const catFilter = categories.filter(c => c.name_kk === category || c.name_ru === category).map(c => `category_id = "${c.id}"`).join(' || ')
        if (catFilter) filterParts.push(`(${catFilter})`)
    }
    
    if (city) filterParts.push(`cafe_id.city = "${city}"`)
    if (restaurantId) filterParts.push(`cafe_id = "${restaurantId}"`)
    if (minPrice) filterParts.push(`price >= ${minPrice}`)
    if (maxPrice) filterParts.push(`price <= ${maxPrice}`)
    if (q) filterParts.push(`(name_kk ~ "${q}" || name_ru ~ "${q}" || description_kk ~ "${q}" || description_ru ~ "${q}")`)

    const sortOrder = sort === 'price_asc' ? 'price' : sort === 'price_desc' ? '-price' : 'sort_order'
    
    const menuItems = await pb.collection('menu_items').getFullList({
        filter: filterParts.join(' && '),
        sort: sortOrder,
        expand: 'cafe_id'
    })

    return (
      <div className="flex flex-col min-h-screen pb-16 bg-muted/20">
        <Header title={category || "Тамақтар"} />
        <main className="flex-1 overflow-auto">
          <div className="max-w-screen-xl mx-auto px-4 py-4 space-y-6">
            <div className="flex gap-2">
              <div className="flex-1"><SearchBar /></div>
              <FilterDrawer
                categories={allCategories as any[] || []}
                cities={uniqueCities as string[]}
                restaurants={restaurantsList as any[] || []}
                currentParams={{ category, city, minPrice, maxPrice, sort, restaurantId }}
              />
            </div>

            {(category || city || minPrice || maxPrice || restaurantId) && (
              <div className="flex flex-wrap gap-2 items-center bg-background p-3 rounded-2xl border border-muted shadow-sm">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Сүзгілер:</span>
                {category && <Badge variant="secondary" className="rounded-lg py-1 px-3 bg-primary/10 text-primary border-none">{category}</Badge>}
                {q && <Badge variant="secondary" className="rounded-lg py-1 px-3 bg-amber-100 text-amber-700 border-none">"{q}"</Badge>}
                {city && <Badge variant="secondary" className="rounded-lg py-1 px-3 bg-blue-100 text-blue-700 border-none">{city}</Badge>}
                {(minPrice || maxPrice) && <Badge variant="secondary" className="rounded-lg py-1 px-3 bg-green-100 text-green-700 border-none">{minPrice || '0'} - {maxPrice || '∞'} ₸</Badge>}
                {restaurantId && <Badge variant="secondary" className="rounded-lg py-1 px-3 bg-purple-100 text-purple-700 border-none">Кафе таңдалды</Badge>}
                <Link href="/restaurants" className="ml-auto">
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-3 w-3 mr-1" /> ТАЗАЛАУ
                  </Button>
                </Link>
              </div>
            )}

            {menuItems && menuItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {menuItems.map((item: any) => (
                  <MenuItemCard
                    key={item.id}
                    layout="horizontal"
                    item={{
                      ...item,
                      restaurant: item.expand?.cafe_id
                        ? { id: item.expand.cafe_id.id, name_ru: item.expand.cafe_id.name_ru, name_en: item.expand.cafe_id.name_en }
                        : undefined,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-background rounded-[2rem] border-2 border-dashed border-muted">
                <div className="text-muted-foreground/20 mb-4 animate-pulse"><Search className="w-16 h-16 mx-auto" /></div>
                <h3 className="text-lg font-bold">Тамақ табылмады</h3>
                <p className="text-sm text-muted-foreground max-w-[200px] mx-auto mt-2 italic text-center">Таңдалған параметрлер бойынша нәтиже жоқ.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  // 3. Tabbed View
  const activeTab = tab || 'all'
  
  let resFilterParts = ['is_open = true']
  if (city) resFilterParts.push(`city = "${city}"`)
  if (q) resFilterParts.push(`(name_kk ~ "${q}" || name_ru ~ "${q}" || description_kk ~ "${q}" || description_ru ~ "${q}")`)

  let menuFilterParts = ['is_available = true']
  if (q) menuFilterParts.push(`(name_kk ~ "${q}" || name_ru ~ "${q}" || description_kk ~ "${q}" || description_ru ~ "${q}")`)

  const [restaurants, menuItems] = await Promise.all([
    pb.collection('restaurants').getFullList({
        filter: resFilterParts.join(' && '),
        sort: '-rating,-created_at'
    }),
    pb.collection('menu_items').getFullList({
        filter: menuFilterParts.join(' && '),
        sort: 'sort_order',
        expand: 'cafe_id'
    })
  ])

  return (
    <div className="flex flex-col min-h-screen pb-16 bg-muted/20">
      <Header title="Мәзірлер" />
      <main className="flex-1 overflow-auto">
        <div className="max-w-screen-xl mx-auto px-4 py-4 space-y-6">
          <div className="flex gap-2">
            <div className="flex-1"><SearchBar /></div>
            <FilterDrawer
              categories={allCategories as any[] || []}
              cities={uniqueCities as string[]}
              restaurants={restaurantsList as any[] || []}
              currentParams={{ category, city, minPrice, maxPrice, sort, restaurantId }}
            />
          </div>

          <div className="flex gap-1 bg-background/50 backdrop-blur-sm rounded-2xl p-1.5 border border-muted shadow-sm overflow-x-auto no-scrollbar">
            <Link href="/restaurants?tab=all" className={`flex-1 min-w-[80px] py-3 rounded-xl text-sm font-bold text-center transition-all ${activeTab === 'all' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' : 'text-muted-foreground hover:bg-muted'}`}>Барлығы</Link>
            <Link href="/restaurants?tab=cafes" className={`flex-1 min-w-[80px] py-3 rounded-xl text-sm font-bold text-center transition-all ${activeTab === 'cafes' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' : 'text-muted-foreground hover:bg-muted'}`}>Кафе</Link>
            <Link href="/restaurants?tab=food" className={`flex-1 min-w-[80px] py-3 rounded-xl text-sm font-bold text-center transition-all ${activeTab === 'food' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' : 'text-muted-foreground hover:bg-muted'}`}>Тамақ</Link>
          </div>

          {activeTab === 'all' && (
            <div className="space-y-10">
              {restaurants && restaurants.length > 0 && <RestaurantSection restaurants={restaurants as any[]} />}
              {menuItems && menuItems.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-2xl font-black italic tracking-tight">Танымал тағамдар</h2>
                    <Link href="/restaurants?tab=food" className="text-xs font-black text-primary hover:underline px-3 py-1 bg-primary/10 rounded-full">КӨБІРЕК</Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    {menuItems.slice(0, 12).map((item: any) => (
                      <MenuItemCard
                        key={item.id}
                        layout="horizontal"
                        item={{
                          ...item,
                          restaurant: item.expand?.cafe_id
                            ? { id: item.expand.cafe_id.id, name_ru: item.expand.cafe_id.name_ru, name_en: item.expand.cafe_id.name_en }
                            : undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cafes' && (
            restaurants && restaurants.length > 0 ? (
              <RestaurantSection restaurants={restaurants as any[]} />
            ) : (
              <div className="text-center py-16 bg-background rounded-[2rem] border-2 border-dashed border-muted">
                <div className="text-muted-foreground/20 mb-3"><Store className="w-12 h-12 mx-auto" /></div>
                <p className="text-muted-foreground font-medium italic text-center">Кафелер табылмады</p>
              </div>
            )
          )}

          {activeTab === 'food' && (
            menuItems && menuItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuItems.map((item: any) => (
                  <MenuItemCard
                    key={item.id}
                    layout="horizontal"
                    item={{
                      ...item,
                      restaurant: item.expand?.cafe_id
                        ? { id: item.expand.cafe_id.id, name_ru: item.expand.cafe_id.name_ru, name_en: item.expand.cafe_id.name_en }
                        : undefined,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-background rounded-[2rem] border-2 border-dashed border-muted">
                <div className="text-muted-foreground/20 mb-3"><Utensils className="w-12 h-12 mx-auto" /></div>
                <p className="text-muted-foreground font-medium italic text-center">Тамақтар табылмады</p>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  )
}
