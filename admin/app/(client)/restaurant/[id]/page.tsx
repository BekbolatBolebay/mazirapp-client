export const dynamic = "force-dynamic"
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Star, Clock, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'
import { query } from '@/lib/db'
import BottomNav from '@/components/layout/bottom-nav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MenuItemCard } from '@/components/restaurant/menu-item-card'
import { FavoriteButton } from '@/components/restaurant/favorite-button'

import { RestaurantHeader } from '@/components/restaurant/restaurant-header'
import { isRestaurantOpen } from '@/lib/restaurant-utils'

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // Fetch restaurant details
    const restRes = await query('SELECT * FROM restaurants WHERE id = $1', [id])
    const restaurant = restRes.rows[0]

    if (!restaurant) {
        notFound()
    }

    // Fetch working hours
    const whRes = await query(
        'SELECT * FROM working_hours WHERE cafe_id = $1 ORDER BY day_of_week',
        [id]
    )
    const workingHours = whRes.rows

    // Fetch categories
    const catRes = await query(
        'SELECT * FROM categories WHERE cafe_id = $1 AND is_active = true ORDER BY sort_order ASC',
        [id]
    )
    const categories = catRes.rows

    // Fetch menu items
    const menuRes = await query(
        'SELECT * FROM menu_items WHERE cafe_id = $1 AND is_available = true ORDER BY sort_order ASC',
        [id]
    )
    const menuItems = menuRes.rows

    // Determine is_open status dynamically
    const status = isRestaurantOpen(restaurant.status, workingHours)
    const isOpen = status.isOpen
    
    const nowAlmatyParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Almaty',
        weekday: 'short'
    }).formatToParts(new Date());
    const weekdayShort = nowAlmatyParts.find(p => p.type === 'weekday')?.value || '';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayIdx = days.indexOf(weekdayShort);

    const timeInfo = workingHours?.find((h: any) => h.day_of_week === todayIdx)
    const workingHoursText = timeInfo && !timeInfo.is_day_off && timeInfo.open_time && timeInfo.close_time
        ? `${timeInfo.open_time.slice(0, 5)} - ${timeInfo.close_time.slice(0, 5)}`
        : 'Closed'

    return (
        <div className="flex flex-col min-h-screen pb-16 bg-slate-950">
            <RestaurantHeader
                restaurant={restaurant}
                isOpen={isOpen}
                workingHoursText={workingHoursText}
                lang="ru"
                actions={<FavoriteButton restaurantId={id} />}
            />

            <main className="flex-1 overflow-auto bg-background -mt-6 relative z-20 rounded-t-[32px] pt-6">
                <div className="max-w-screen-xl mx-auto px-4">
                    <div className="mb-6">
                        <div className="flex items-start justify-between mb-2">
                            <h1 className="text-2xl font-bold">{restaurant.name_ru || restaurant.name_en}</h1>
                            <div className="flex items-center gap-1.5 ml-2 bg-accent/10 px-2 py-1 rounded-lg">
                                <Star className="w-4 h-4 fill-accent text-accent" />
                                <span className="text-base font-bold text-accent">{Number(restaurant.rating || 5.0).toFixed(1)}</span>
                            </div>
                        </div>

                        {(restaurant.description_ru || restaurant.description_en) && (
                            <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                                {restaurant.description_ru || restaurant.description_en}
                            </p>
                        )}

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="flex items-center gap-2 p-3 rounded-2xl bg-secondary/50 border border-border/50">
                                <Clock className="w-4 h-4 text-primary" />
                                <span className="text-xs font-medium">
                                    {restaurant.delivery_time_min || 30}-{restaurant.delivery_time_max || 45} мин
                                </span>
                            </div>
                            <div className="flex items-center gap-2 p-3 rounded-2xl bg-secondary/50 border border-border/50 text-xs font-medium">
                                {restaurant.delivery_fee === 0 ? (
                                    <span className="text-green-600 dark:text-green-400">Тапсырысқа қосалады жеткізу ақысы</span>
                                ) : (
                                    <span>Жеткізу: {restaurant.delivery_fee} ₸</span>
                                )}
                            </div>
                        </div>

                        {restaurant.address && (
                            <div className="flex items-start gap-2 text-sm mb-4 bg-secondary/30 p-3 rounded-2xl border border-border/50">
                                <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                                <span className="text-muted-foreground leading-snug">{restaurant.address}</span>
                            </div>
                        )}

                        {restaurant.phone && (
                            <Button
                                variant="outline"
                                className="w-full justify-center gap-2 rounded-2xl h-12 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                                asChild
                            >
                                <a href={`tel:${restaurant.phone}`}>
                                    <Phone className="w-4 h-4 text-primary" />
                                    <span className="text-primary font-bold">Кафемен байланысу</span>
                                </a>
                            </Button>
                        )}
                    </div>

                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="w-full justify-start gap-2 h-auto p-0 bg-transparent border-b border-border rounded-none mb-6 overflow-x-auto scrollbar-none">
                            <TabsTrigger
                                value="all"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm font-bold"
                            >
                                Барлығы
                            </TabsTrigger>
                            {categories?.map((cat: any) => (
                                <TabsTrigger
                                    key={cat.id}
                                    value={cat.id}
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm font-bold whitespace-nowrap"
                                >
                                    {cat.name_ru}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <TabsContent value="all" className="mt-0 pb-10">
                            <div className="grid grid-cols-2 gap-4">
                                {menuItems?.map((item: any) => (
                                    <MenuItemCard key={item.id} item={item} />
                                ))}
                            </div>
                        </TabsContent>

                        {categories?.map((cat: any) => (
                            <TabsContent key={cat.id} value={cat.id} className="mt-0 pb-10">
                                <div className="grid grid-cols-2 gap-4">
                                    {menuItems
                                        ?.filter((item: any) => item.category_id === cat.id)
                                        .map((item: any) => (
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
