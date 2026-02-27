'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useI18n } from '@/lib/i18n/i18n-context'

const categories = [
  { id: 'fast-food', image: '/images/categories/fast-food.png', nameEn: 'Fast Food', nameRu: 'Фаст-фуд' },
  { id: 'desserts', image: '/images/categories/desserts.png', nameEn: 'Desserts', nameRu: 'Үлттық тағамдар' },
  { id: 'drinks', image: '/images/categories/drinks.png', nameEn: 'Drinks', nameRu: 'Сусындар' },
  { id: 'dinner', image: '/images/categories/dinner.png', nameEn: 'Dinner', nameRu: 'Кешкі аска' },
  { id: 'combos', image: '/images/categories/combos.png', nameEn: 'Combos', nameRu: 'Комболар' },
  { id: 'diet', image: '/images/categories/diet-food.png', nameEn: 'Diet Food', nameRu: 'Десерттер' },
  { id: 'snacks', image: '/images/categories/snacks.png', nameEn: 'Snacks', nameRu: 'Диеталық тағамдар' },
  { id: 'more', image: '/images/categories/all.png', nameEn: 'More', nameRu: 'Барлығы' },
]

export function CategoryGrid() {
  const { t, locale } = useI18n()

  return (
    <section>
      <h2 className="text-lg font-bold mb-4">{t.home.categories}</h2>
      <div className="grid grid-cols-4 gap-4 px-2">
        {categories.map((category) => (
          <Link key={category.id} href="/restaurants" className="block group">
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative w-14 h-14 rounded-full overflow-hidden bg-accent/5 ring-1 ring-border/50 group-hover:ring-primary/30 transition-all duration-300">
                <Image
                  src={category.image}
                  alt={locale === 'ru' ? category.nameRu : category.nameEn}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight text-muted-foreground group-hover:text-primary transition-colors line-clamp-1 px-0.5">
                {locale === 'ru' ? category.nameRu : category.nameEn}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
