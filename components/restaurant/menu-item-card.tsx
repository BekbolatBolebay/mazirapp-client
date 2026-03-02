'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Minus, X, ShoppingCart } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { addToLocalCart, LocalCartItem } from '@/lib/storage/local-storage'
import { Database } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type MenuItem = Database['public']['Tables']['menu_items']['Row'] & {
  restaurant?: {
    name_ru: string
    name_en: string
    id?: string
  }
}

export function MenuItemCard({ item }: { item: MenuItem }) {
  const { locale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const [qty, setQty] = useState(1)

  const name = locale === 'ru' ? item.name_ru : (item.name_kk || item.name_ru)
  const desc = locale === 'ru' ? item.description_ru : (item.description_kk || item.description_ru)
  const cafeName = locale === 'ru'
    ? (item.restaurant?.name_ru || '')
    : (item.restaurant?.name_en || item.restaurant?.name_ru || '')

  function addToCart(quantity = 1) {
    const cartItem: LocalCartItem = {
      id: `cart_${Date.now()}_${item.id}`,
      menu_item_id: item.id,
      restaurant_id: item.restaurant_id,
      quantity,
      menu_item: {
        name_ru: item.name_ru,
        name_en: item.name_en,
        price: item.price,
        image_url: item.image_url || '',
        restaurant: {
          name_ru: item.restaurant?.name_ru || '',
          name_en: item.restaurant?.name_en || '',
        },
      },
    }
    addToLocalCart(cartItem)
    toast.success(`${name} — Себетке қосылды ✓`)
    setOpen(false)
    setQty(1)
  }

  return (
    <>
      {/* ── Card ── */}
      <div
        className="bg-card rounded-2xl border border-border overflow-hidden cursor-pointer active:scale-95 transition-all shadow-sm hover:shadow-md"
        onClick={() => { setOpen(true); setQty(1) }}
      >
        {/* Image */}
        <div className="relative aspect-square bg-muted">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl select-none">🍽️</div>
          )}
          {/* Quick add button */}
          <button
            onClick={e => { e.stopPropagation(); addToCart(1) }}
            disabled={!item.is_available}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md active:scale-90 transition-all disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="p-2.5">
          <p className="text-xs font-semibold text-foreground line-clamp-2 min-h-[2rem] mb-1">{name}</p>
          {cafeName && (
            <p className="text-[10px] text-muted-foreground mb-1 truncate">📍 {cafeName}</p>
          )}
          <p className="text-sm font-bold text-primary">{item.price.toFixed(0)}₸</p>
        </div>
      </div>

      {/* ── Modal (bottom sheet) ── */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Close button */}
            <div className="flex justify-end p-4 pb-0">
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image */}
            {item.image_url && (
              <div className="relative h-52 mx-4 rounded-2xl overflow-hidden bg-muted">
                <Image src={item.image_url} alt={name} fill className="object-cover" unoptimized />
              </div>
            )}

            <div className="px-5 py-4">
              {/* Cafe name */}
              {cafeName && (
                <p className="text-xs text-muted-foreground mb-1">📍 {cafeName}</p>
              )}

              {/* Name */}
              <h2 className="text-xl font-bold text-foreground mb-2">{name}</h2>

              {/* Description */}
              {desc && (
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{desc}</p>
              )}

              {/* Price */}
              <p className="text-2xl font-bold text-primary mb-5">
                {(item.price * qty).toFixed(0)}₸
              </p>

              {/* Quantity + Add to cart */}
              <div className="flex items-center gap-3 mb-4">
                {/* Qty stepper */}
                <div className="flex items-center gap-3 bg-secondary rounded-2xl px-3 py-2">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-xl bg-card flex items-center justify-center active:scale-90 transition-all shadow-sm"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-bold w-6 text-center">{qty}</span>
                  <button
                    onClick={() => setQty(q => q + 1)}
                    className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center active:scale-90 transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add to cart */}
                <Button
                  className="flex-1 h-12 gap-2 rounded-2xl font-bold text-base"
                  disabled={!item.is_available}
                  onClick={() => addToCart(qty)}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Себетке қосу
                </Button>
              </div>

              {!item.is_available && (
                <p className="text-center text-xs text-destructive font-medium">Уақытша жоқ</p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
