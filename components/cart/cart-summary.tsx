'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export function CartSummary({
  subtotal,
  deliveryFee,
  total,
  restaurantId,
}: {
  subtotal: number
  deliveryFee: number
  total: number
  restaurantId?: string
}) {
  const router = useRouter()
  const [promoCode, setPromoCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    if (!restaurantId) {
      toast.error('Қате орын алды')
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('Жүйеге кіріңіз')
        router.push('/auth/signin')
        return
      }

      const { data: cartItems } = await supabase
        .from('cart_items')
        .select('*, menu_items(*)')
        .eq('user_id', user.id)

      if (!cartItems || cartItems.length === 0) {
        toast.error('Себет бос')
        return
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          restaurant_id: restaurantId,
          status: 'pending',
          total_amount: total,
          delivery_fee: deliveryFee,
        })
        .select()
        .single()

      if (orderError) throw orderError

      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price: item.menu_items?.price || 0,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      toast.success('Тапсырыс жасалды!')
      router.push(`/orders/${order.id}`)
    } catch (error) {
      console.error('[v0] Error creating order:', error)
      toast.error('Қате орын алды')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Промокод енгізіңіз"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline">Қолдану</Button>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Тауарлар</span>
            <span className="font-medium">{subtotal.toFixed(0)}₸</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Жеткізу</span>
            <span className="font-medium">
              {deliveryFee === 0 ? 'Тегін' : `${deliveryFee.toFixed(0)}₸`}
            </span>
          </div>

          <Separator />

          <div className="flex items-center justify-between text-lg font-bold">
            <span>Барлығы</span>
            <span className="text-primary">{total.toFixed(0)}₸</span>
          </div>
        </div>

        <Button
          className="w-full h-12 text-base"
          size="lg"
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? 'Жүктелуде...' : 'Тапсырысты растау'}
        </Button>
      </CardContent>
    </Card>
  )
}
