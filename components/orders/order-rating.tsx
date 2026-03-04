'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
    const [rating, setRating] = useState(initialRating)
    const [comment, setComment] = useState(initialComment)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(initialRating > 0)
    const supabase = createClient()

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Жұлдызшаны таңдаңыз')
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
                    order_id: orderId, // Assuming this column exists or can be added
                })

            if (error) throw error

            setSubmitted(true)
            toast.success('Пікіріңіз үшін рахмет!')
        } catch (error: any) {
            console.error('Error submitting review:', error)
            toast.error('Қате орын алды: ' + error.message)
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
                    <p className="text-sm font-medium">Пікіріңіз қабылданды. Рахмет!</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardContent className="p-4 space-y-4">
                <div className="text-center">
                    <h3 className="font-bold text-lg">Тапсырысты бағалаңыз</h3>
                    <p className="text-sm text-muted-foreground">Сіздің пікіріңіз біз үшін маңызды</p>
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
                    placeholder="Пікіріңізді қалдырыңыз (міндетті емес)..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[80px] text-sm"
                />

                <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={isSubmitting || rating === 0}
                >
                    {isSubmitting ? 'Жіберілуде...' : 'Жіберу'}
                </Button>
            </CardContent>
        </Card>
    )
}
