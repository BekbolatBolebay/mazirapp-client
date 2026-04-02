'use client'

import { useEffect, useRef } from 'react'
import pb from '@/utils/pocketbase'
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

    console.log('[OrderStatusListener] Setting up real-time listener for user:', user.id)

    const unsubscribePromise = pb.collection('orders').subscribe('*', (e) => {
      if (e.action === 'update' && e.record.user_id === user.id) {
        const newOrder = e.record
        
        console.log('[OrderStatusListener] Order update received:', {
          orderId: newOrder.id,
          orderNumber: newOrder.order_number,
          newStatus: newOrder.status,
        })

        // Prevent duplicate notifications
        const lastStatus = lastStatusRef.current[newOrder.id]
        if (lastStatus === newOrder.status) return
        
        lastStatusRef.current[newOrder.id] = newOrder.status
        showNotification(newOrder.status, newOrder.order_number, newOrder.id)
      }
    })

    return () => {
      unsubscribePromise.then(unsub => unsub())
    }
  }, [user?.id])

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
