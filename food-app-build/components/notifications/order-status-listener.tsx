'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n/i18n-context'
import { useAuth } from '@/lib/auth/auth-context'
import { playNotificationSound } from '@/lib/sound-utils'
import { showClientNotification } from '@/lib/client-notification-utils'

export function OrderStatusListener() {
  const { user } = useAuth()
  const { locale } = useI18n()
  const lastStatusRef = useRef<Record<string, string>>({})

  useEffect(() => {
    if (!user?.id) return

    console.log('[OrderStatusListener] Setting up polling listener for user:', user.id)

    const fetchActiveOrders = async () => {
      try {
        const res = await fetch('/api/orders/active')
        const data = await res.json()
        
        if (data && data.orders) {
          data.orders.forEach((order: any) => {
             const lastStatus = lastStatusRef.current[order.id]
             if (lastStatus && lastStatus !== order.status) {
                console.log('[OrderStatusListener] Order update detected via polling:', {
                  orderId: order.id,
                  newStatus: order.status,
                })
                showNotification(order.status, order.order_number || order.id.slice(0,8), order.id)
             }
             lastStatusRef.current[order.id] = order.status
          })
        }
      } catch (error) {
        console.error('[OrderStatusListener] Polling Error:', error)
      }
    }

    // Initial fetch to populate lastStatusRef
    fetchActiveOrders()

    const interval = setInterval(fetchActiveOrders, 10000) // Poll every 10 seconds
    return () => clearInterval(interval)
  }, [user?.id, locale])

  const showNotification = async (status: string, orderNum: string, orderId: string) => {
    const titles: Record<string, string> = {
      accepted: locale === 'kk' ? 'Тапсырыс қабылданды!' : 'Заказ принят!',
      preparing: locale === 'kk' ? 'Дайындалуда!' : 'Готовится!',
      ready: locale === 'kk' ? 'Тапсырыс дайын!' : 'Заказ готов!',
      on_the_way: locale === 'kk' ? 'Жолда!' : 'В пути!',
      completed: locale === 'kk' ? 'Аяқталды!' : 'Завершен!',
      cancelled: locale === 'kk' ? 'Бас тартылды' : 'Отменен',
    }

    const title = titles[status] || (locale === 'kk' ? 'Тапсырыс жаңартылды' : 'Заказ обновлен')
    const body = locale === 'kk'
      ? `#${orderNum} тапсырыс күйі: ${status}`
      : `Статус заказа #${orderNum}: ${status}`

    console.log('[OrderStatusListener] Showing notification:', { title, body, status })

    // Show toast notification
    toast.success(title, {
      description: body,
      duration: 5000,
    })

    // Show push notification with sound
    try {
      await showClientNotification({
        title,
        body,
        url: `/orders/${orderId}`,
        playSound: true,
        soundType: 'status-update',
        tag: `order-${orderId}`,
        requireInteraction: status === 'ready' || status === 'completed', // More attention for ready/completed
      })

      console.log('[OrderStatusListener] Notification sent successfully')
    } catch (error) {
      console.error('[OrderStatusListener] Error showing notification:', error)
    }
  }

  return null
}
