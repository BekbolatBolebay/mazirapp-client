'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useI18n } from '@/lib/i18n/i18n-context'

import { LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Category {
  name_ru: string
  name_kk: string
  icon_url?: string
}

export function CategoryGrid({ initialCategories }: { initialCategories: any[] }) {
  const { t, locale } = useI18n()
  const [categories, setCategories] = useState(initialCategories)

  useEffect(() => {
    // Sync if initialCategories changes
    setCategories(initialCategories)
  }, [initialCategories])

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-black text-foreground tracking-tight">
          {t.home.categories}
        </h2>
        <Link href="/categories" className="text-[10px] font-black uppercase tracking-widest text-primary">
          {locale === 'kk' ? 'Барлығы' : 'Все'}
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar -mx-5 px-5">
        {categories.map((category, index) => (
          <Link
            key={index}
            href={`/restaurants?category=${encodeURIComponent(category.name_ru)}`}
            className="flex-shrink-0 group flex flex-col items-center gap-2"
          >
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 shadow-sm group-hover:shadow-md group-hover:border-primary/30 transition-all duration-500 flex items-center justify-center group-active:scale-90">
              {category.icon_url ? (
                <Image
                  src={category.icon_url}
                  alt={locale === 'ru' ? category.name_ru : category.name_kk}
                  fill
                  className="object-cover p-2 group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                  <LayoutGrid className="w-6 h-6 opacity-30 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
            <span className="text-[11px] font-black text-center text-muted-foreground group-hover:text-foreground transition-colors max-w-[70px] truncate">
              {locale === 'ru' ? category.name_ru : category.name_kk}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
