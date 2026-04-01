import { Star, User, Calendar, MessageCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { useI18n } from '@/lib/i18n/i18n-context'

interface Review {
  id: string
  customer_name: string
  rating: number
  comment: string
  admin_reply?: string
  created_at: string
}

interface RestaurantReviewsProps {
  reviews: Review[]
  rating: number
}

export function RestaurantReviews({ reviews, rating }: RestaurantReviewsProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Rating Summary */}
      <section className="text-center py-6 bg-card rounded-3xl border border-border/50 shadow-sm space-y-2">
        <div className="flex items-center justify-center gap-3">
          <Star className="w-10 h-10 fill-accent text-accent animate-pulse" />
          <span className="text-5xl font-black text-foreground tracking-tighter">
            {rating?.toFixed(1) || '0.0'}
          </span>
        </div>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
          {reviews?.length || 0} {t.restaurant.reviewsCount}
        </p>
      </section>

      <Separator className="bg-border/30" />

      {/* Reviews List */}
      <section className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <Card 
              key={review.id} 
              className="border-none shadow-sm rounded-3xl overflow-hidden bg-card/60 backdrop-blur-sm transition-all hover:shadow-md"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {review.customer_name || 'User'}
                      </p>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${s <= review.rating ? 'fill-accent text-accent' : 'text-muted/20'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg flex items-center gap-1">
                     <Calendar className="w-3 h-3" />
                     {review.created_at ? format(new Date(review.created_at), 'dd.MM.yyyy') : ''}
                  </div>
                </div>

                {review.comment && (
                  <div className="relative pl-4 border-l-2 border-primary/20">
                    <p className="text-sm text-foreground/80 leading-relaxed italic">
                      "{review.comment}"
                    </p>
                  </div>
                )}
                
                {review.admin_reply && (
                  <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 mt-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{t.restaurant.adminReply}</p>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      {review.admin_reply}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 space-y-4 bg-muted/20 rounded-[2.5rem] border border-dashed border-border/50">
             <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-20">
                <MessageCircle className="w-8 h-8" />
             </div>
             <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground italic">{t.restaurant.noReviews}</p>
                <p className="text-[10px] text-muted-foreground/60 tracking-wider">{t.restaurant.beFirst}</p>
             </div>
          </div>
        )}
      </section>
    </div>
  )
}
