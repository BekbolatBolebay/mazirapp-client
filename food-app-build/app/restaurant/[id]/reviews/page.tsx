import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft, Star, User, Calendar, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { ru, kk } from 'date-fns/locale'

export const metadata: Metadata = {
  title: 'Пікірлер | Məzir APP',
  description: 'Кафе туралы пікірлер'
}

export default async function RestaurantReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch restaurant basic info for header
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name_kk, name_ru, rating')
    .eq('id', id)
    .single()

  if (!restaurant) {
    notFound()
  }

  // Fetch reviews
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('cafe_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[ReviewsPage] Error fetching reviews:', error)
  }

  // Determine locale for date formatting (simplified, in a real app you'd get this from middleware/context)
  // For now we'll check common patterns or just use ru as fallback
  const dateLocale = ru // Default

  return (
    <div className="flex flex-col min-h-screen bg-muted/30 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center h-14 px-4 max-w-screen-xl mx-auto">
          <Link href={`/restaurant/${id}`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="ml-2">
            <h1 className="text-lg font-bold truncate max-w-[200px]">
              {restaurant.name_kk || restaurant.name_ru}
            </h1>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Пікірлер</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-screen-md mx-auto w-full px-4 py-6 space-y-6">
        {/* Rating Summary */}
        <section className="text-center py-4 space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-center gap-2">
            <Star className="w-10 h-10 fill-accent text-accent" />
            <span className="text-5xl font-black text-foreground">{restaurant.rating?.toFixed(1) || '0.0'}</span>
          </div>
          <p className="text-muted-foreground font-medium">
            {reviews?.length || 0} пікір қалдырылды
          </p>
        </section>

        <Separator className="bg-border/50" />

        {/* Reviews List */}
        <section className="space-y-4">
          {reviews && reviews.length > 0 ? (
            reviews.map((review) => (
              <Card key={review.id} className="border-none shadow-sm rounded-3xl overflow-hidden bg-card transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {review.customer_name || 'Қолданушы'}
                        </p>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${s <= review.rating ? 'fill-accent text-accent' : 'text-muted/30'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg flex items-center gap-1">
                       <Calendar className="w-3 h-3" />
                       {review.created_at ? format(new Date(review.created_at), 'dd.MM.yyyy') : ''}
                    </div>
                  </div>

                  {review.comment && (
                    <div className="relative">
                      <div className="absolute -left-2 top-0 bottom-0 w-1 bg-primary/10 rounded-full" />
                      <p className="text-sm text-foreground/80 leading-relaxed italic px-2">
                        "{review.comment}"
                      </p>
                    </div>
                  )}
                  
                  {review.admin_reply && (
                    <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 mt-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Ресторан жауабы:</p>
                      <p className="text-sm text-foreground/70 leading-relaxed">
                        {review.admin_reply}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-20 space-y-4 bg-card rounded-[2.5rem] border border-dashed border-border/50">
               <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-20">
                  <MessageCircle className="w-8 h-8" />
               </div>
               <div className="space-y-1">
                  <p className="text-sm font-bold text-muted-foreground italic">Әзірге пікірлер жоқ</p>
                  <p className="text-[10px] text-muted-foreground/60">Бірінші болып пікір қалдырыңыз!</p>
               </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
