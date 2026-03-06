'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { useI18n } from '@/lib/i18n/i18n-context'

interface OrderRatingProps {
    orderId: string
    restaurantId: string
    customerName: string
    initialRating?: number
    initialComment?: string
}

export function OrderRating({
    orderId,
    restaurantId,
    customerName,
    initialRating = 0,
    initialComment = ''
}: OrderRatingProps) {
    const { t } = useI18n()
    const [rating, setRating] = useState(initialRating)
    const [comment, setComment] = useState(initialComment)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(initialRating > 0)
    const supabase = createClient()

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error(t.orders.selectStarToast)
            return
        }

        setIsSubmitting(true)
        try {
            const { error } = await supabase
                .from('reviews')
                .insert({
                    cafe_id: restaurantId,
                    customer_name: customerName,
                    rating,
                    comment,
                    order_id: orderId,
                })

            if (error) throw error

            setSubmitted(true)
            toast.success(t.orders.reviewThanksToast)
        } catch (error: any) {
            console.error('Error submitting review:', JSON.stringify(error, null, 2))
            toast.error(t.cart.order_error + (error.message || 'Unknown error'))
        } finally {
            setIsSubmitting(false)
        }
    }

    if (submitted) {
        return (
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 text-center">
                    <div className="flex justify-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                                key={s}
                                className={cn(
                                    "w-5 h-5",
                                    s <= rating ? "fill-primary text-primary" : "text-muted-foreground"
                                )}
                            />
                        ))}
                    </div>
                    <p className="text-sm font-medium">{t.orders.ratingSubmitted}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardContent className="p-4 space-y-4">
                <div className="text-center">
                    <h3 className="font-bold text-lg">{t.orders.rateOrder}</h3>
                    <p className="text-sm text-muted-foreground">{t.orders.rateDesc}</p>
                </div>

                <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <button
                            key={s}
                            onClick={() => setRating(s)}
                            className="focus:outline-none transition-transform active:scale-110"
                        >
                            <Star
                                className={cn(
                                    "w-8 h-8 transition-colors",
                                    s <= rating ? "fill-primary text-primary" : "text-muted-foreground hover:text-primary/50"
                                )}
                            />
                        </button>
                    ))}
                </div>

                <Textarea
                    placeholder={t.orders.reviewPlaceholder}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[80px] text-sm"
                />

                <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={isSubmitting || rating === 0}
                >
                    {isSubmitting ? t.cart.sending : t.orders.submitBtn}
                </Button>
            </CardContent>
        </Card>
    )
}
