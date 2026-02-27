'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { toggleLocalFavorite, isLocalFavorite } from '@/lib/storage/local-storage'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n/i18n-context'

export function FavoriteButton({ restaurantId }: { restaurantId: string }) {
  const { t } = useI18n()
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setIsFavorite(isLocalFavorite(restaurantId))
  }, [restaurantId])

  const handleToggle = () => {
    setLoading(true)

    try {
      const newState = toggleLocalFavorite(restaurantId)
      setIsFavorite(newState)
      
      if (newState) {
        toast.success(t('addedToFavorites'))
      } else {
        toast.success(t('removedFromFavorites'))
      }
    } catch (error) {
      console.error('[v0] Error toggling favorite:', error)
      toast.error(t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      className="rounded-full bg-background/80 backdrop-blur hover:bg-background/90"
      onClick={handleToggle}
      disabled={loading}
    >
      <Heart
        className={`h-5 w-5 ${isFavorite ? 'fill-primary text-primary' : 'text-foreground'}`}
      />
    </Button>
  )
}
