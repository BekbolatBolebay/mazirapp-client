'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Clock, Trophy } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface FeaturedSliderProps {
    restaurants: any[]
}

export function FeaturedSlider({ restaurants }: FeaturedSliderProps) {
    const { locale } = useI18n()

    if (!restaurants || restaurants.length === 0) return null

    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-black tracking-tight">
                    {locale === 'kk' ? 'Ең үздік кафелер' : 'Лучшие заведения'}
                </h2>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 px-1 no-scrollbar -mx-5 px-5">
                {restaurants.map((restaurant, idx) => (
                    <motion.div
                        key={restaurant.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex-shrink-0 w-80"
                    >
                        <Link href={`/restaurant/${restaurant.id}`}>
                            <Card className="relative h-48 overflow-hidden border-none shadow-xl rounded-[2rem] group">
                                {restaurant.image_url ? (
                                    <Image
                                        src={restaurant.image_url}
                                        alt={locale === 'ru' ? restaurant.name_ru : restaurant.name_kk}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-black flex items-center justify-center">
                                        <Star className="w-12 h-12 text-white/20" />
                                    </div>
                                )}
                                
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                {/* Badges */}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <Badge className="bg-black/90 text-white border-none font-black rounded-lg backdrop-blur-sm">
                                        FEATURED
                                    </Badge>
                                    {restaurant.rating > 4.5 && (
                                        <Badge className="bg-primary text-white border-none font-black rounded-lg shadow-lg">
                                            TOP RATED
                                        </Badge>
                                    )}
                                </div>

                                {/* Content */}
                                <CardContent className="absolute bottom-0 left-0 right-0 p-5 text-white">
                                    <h3 className="text-xl font-black tracking-tight mb-1 group-hover:text-primary transition-colors uppercase">
                                        {locale === 'ru' ? restaurant.name_ru : restaurant.name_kk}
                                    </h3>
                                    <div className="flex items-center gap-3 text-xs font-bold text-white/80">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                            <span>{restaurant.rating != null ? restaurant.rating.toFixed(1) : '0.0'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>20-35 min</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="opacity-50">•</span>
                                            <span>Free delivery</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </section>
    )
}
