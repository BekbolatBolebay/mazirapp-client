'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useI18n } from '@/lib/i18n/i18n-context'

import { LayoutGrid } from 'lucide-react'

interface Category {
  name_ru: string
  name_kk: string
  image?: string
}

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const { t, locale } = useI18n()

  const displayCategories = categories.slice(0, 7)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{t.home.categories}</h2>
        <Link href="/categories" className="text-sm text-primary font-medium">
          Барлығы
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-4 px-2">
        {displayCategories.map((category, index) => (
          <Link
            key={index}
            href={`/restaurants?category=${encodeURIComponent(category.name_ru)}`}
            className="block group"
          >
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative w-14 h-14 rounded-full overflow-hidden bg-accent/5 ring-1 ring-border/50 group-hover:ring-primary/30 transition-all duration-300 flex items-center justify-center">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={locale === 'ru' ? category.name_ru : category.name_kk}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5 text-primary/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight text-muted-foreground group-hover:text-primary transition-colors line-clamp-1 px-0.5">
                {locale === 'ru' ? category.name_ru : category.name_kk}
              </span>
            </div>
          </Link>
        ))}

        {/* "More" Card if we have many categories or just as a shortcut */}
        <Link href="/categories" className="block group">
          <div className="flex flex-col items-center gap-1.5">
            <div className="relative w-14 h-14 rounded-full overflow-hidden bg-secondary ring-1 ring-border/50 group-hover:ring-primary/30 transition-all duration-300 flex items-center justify-center">
              <LayoutGrid className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[10px] font-medium text-center leading-tight text-muted-foreground group-hover:text-primary transition-colors">
              Көбірек
            </span>
          </div>
        </Link>
      </div>
    </section>
  )
}
