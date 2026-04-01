'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import {
  ArrowLeft, Star, Clock, MapPin, Phone,
  CalendarCheck, Share2, Info, ShoppingBag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MenuItemCard } from '@/components/restaurant/menu-item-card'
import { FavoriteButton } from '@/components/restaurant/favorite-button'
import { ShareButton } from '@/components/restaurant/share-button'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/i18n-context'
import RestaurantMap from '@/components/restaurant/restaurant-map'
import { RestaurantReviews } from '@/components/restaurant/restaurant-reviews'

interface RestaurantClientProps {
  restaurant: any
  categories: any[] | null
  menuItems: any[] | null
  reviews: any[] | null
  status: { isOpen: boolean; message: string }
  workingHoursText: string
}

export function RestaurantClient({
  restaurant,
  categories,
  menuItems,
  reviews,
  status,
  workingHoursText
}: RestaurantClientProps) {
  const router = useRouter()
  const { t, locale } = useI18n()
  const [activeTab, setActiveTab] = useState('all')
  const [isHeaderSticky, setIsHeaderSticky] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()

  const headerOpacity = useTransform(scrollY, [0, 100], [0, 1])
  const imageScale = useTransform(scrollY, [0, 200], [1, 1.1])

  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderSticky(window.scrollY > 150)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const filteredItems = activeTab === 'all'
    ? menuItems
    : menuItems?.filter(item => item.category_id === activeTab)

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-background pb-32" ref={containerRef}>
      {/* Sticky Top Header */}
      <motion.header
        style={{ opacity: headerOpacity }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 transition-all",
          isHeaderSticky ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => router.back()}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="font-black text-sm truncate max-w-[150px] uppercase tracking-tight">
            {locale === 'ru' ? restaurant.name_ru : (restaurant.name_kk || restaurant.name_ru)}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <ShareButton id={restaurant.id} name={locale === 'ru' ? restaurant.name_ru : (restaurant.name_kk || restaurant.name_ru)} />
          <FavoriteButton restaurantId={restaurant.id} />
        </div>
      </motion.header>

      {/* Hero Banner Section */}
      <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
        <motion.div style={{ scale: imageScale }} className="absolute inset-0">
          {restaurant.banner_url ? (
            <Image
              src={restaurant.banner_url}
              alt={locale === 'ru' ? restaurant.name_ru : (restaurant.name_kk || restaurant.name_ru)}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </motion.div>

        {/* Floating Actions */}
        {!isHeaderSticky && (
          <div className="absolute top-6 left-5 right-5 z-10 flex items-center justify-between">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => router.back()}
              className="rounded-2xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur-md border border-white/10 rounded-2xl p-1 flex gap-1">
                <ShareButton id={restaurant.id} name={locale === 'ru' ? restaurant.name_ru : (restaurant.name_kk || restaurant.name_ru)} />
                <FavoriteButton restaurantId={restaurant.id} />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Info Overlay */}
        <div className="absolute bottom-6 left-5 right-5 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn(
                "border-none font-black rounded-lg px-2.5 shadow-lg",
                status.isOpen ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
              )}>
                {status.isOpen ? (t.restaurant.open || 'OPEN') : (t.restaurant.closed || 'CLOSED')}
              </Badge>
              {restaurant.cuisine_types?.map((type: string) => (
                <Badge key={type} className="bg-white/20 backdrop-blur-md border-none text-white font-bold opacity-80">
                  {type}
                </Badge>
              ))}
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase drop-shadow-2xl">
              {locale === 'ru' ? restaurant.name_ru : (restaurant.name_kk || restaurant.name_ru)}
            </h1>
          </motion.div>
        </div>
      </div>

      {/* Features Info Bar */}
      <div className="relative -mt-6 px-5 z-20">
        <div className="grid grid-cols-3 gap-3 p-4 bg-white dark:bg-zinc-900 rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-black/50 border border-zinc-100 dark:border-zinc-800">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 text-primary">
              <Star className="w-4 h-4 fill-primary" />
              <span className="font-black text-lg">{restaurant.rating.toFixed(1)}</span>
            </div>
            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{t.restaurant.rating}</span>
          </div>
          <div className="border-x border-zinc-100 dark:border-zinc-800 flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 text-zinc-900 dark:text-white">
              <Clock className="w-4 h-4" />
              <span className="font-black text-lg">{restaurant.delivery_time_min || '30'}{t.restaurant.deliveryTime}</span>
            </div>
            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{t.restaurant.delivery}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 text-emerald-600">
              <span className="font-black text-lg">{restaurant.delivery_fee > 0 ? `${restaurant.delivery_fee}₸` : t.restaurant.free}</span>
            </div>
            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{t.restaurant.fee}</span>
          </div>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="max-w-screen-xl mx-auto px-5 mt-8 space-y-10">

        {/* Booking Banner */}
        {restaurant.is_booking_enabled && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/checkout?type=booking&restaurant=${restaurant.id}`)}
            className="group relative overflow-hidden p-6 rounded-[2.5rem] bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-white shadow-xl shadow-primary/20 cursor-pointer active:shadow-inner transition-all"
          >
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl transition-transform group-hover:scale-125 duration-700" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tighter uppercase leading-none">{t.restaurant.reserveTable}</h3>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.15em]">Fast & Instant confirmation</p>
              </div>
              <div
                className="bg-white text-primary rounded-2xl h-10 px-5 font-black text-[11px] uppercase shadow-lg shadow-black/10 flex items-center gap-2 group-hover:bg-white/90 transition-all active:scale-95"
              >
                <CalendarCheck className="w-4 h-4" />
                {t.cart.booking}
              </div>
            </div>
          </motion.div>
        )}

        {/* Details Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
            <Info className="w-3.5 h-3.5" />
            <span>{t.restaurant.information}</span>
          </div>
          <div className="space-y-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {restaurant.address && (
              <div className="flex items-start gap-4 p-4 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>{restaurant.address}</span>
              </div>
            )}
            {restaurant.latitude && restaurant.longitude && (
              <RestaurantMap
                latitude={restaurant.latitude}
                longitude={restaurant.longitude}
                restaurantName={locale === 'ru' ? restaurant.name_ru : (restaurant.name_kk || restaurant.name_ru)}
                address={restaurant.address}
              />
            )}
            <div className="flex items-center gap-4 p-4 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
              <Clock className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 flex justify-between items-center">
                <span className="font-bold">{t.restaurant.workingHours}</span>
                <span className="text-xs font-black uppercase text-emerald-600">{workingHoursText}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Menu Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between sticky top-16 z-30 bg-white/50 dark:bg-background/50 backdrop-blur-md py-4 -mx-5 px-5">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  "px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap border-2",
                  activeTab === 'all'
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                    : "bg-zinc-100 dark:bg-zinc-900 text-muted-foreground border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
                )}
              >
                {t.restaurant.allMenu}
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={cn(
                    "px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap border-2",
                    activeTab === cat.id
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                      : "bg-zinc-100 dark:bg-zinc-900 text-muted-foreground border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
                  )}
                >
                  {locale === 'ru' ? cat.name_ru : (cat.name_kk || cat.name_ru)}
                </button>
              ))}
            </div>
          </div>

          <motion.div
            key={activeTab}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4"
          >
            {filteredItems?.map((item) => (
              <motion.div key={item.id} variants={itemVariants}>
                <MenuItemCard
                  item={item}
                  isOpen={status.isOpen}
                  layout="horizontal"
                />
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Reviews Section */}
        {reviews && (
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
              <Star className="w-3.5 h-3.5 fill-primary" />
              <span>{t.restaurant.reviews}</span>
            </div>
            <RestaurantReviews reviews={reviews} rating={restaurant.rating} />
          </section>
        )}
      </div>
    </div>
  )
}
