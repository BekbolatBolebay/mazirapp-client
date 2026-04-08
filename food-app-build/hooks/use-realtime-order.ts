'use client'

import { useEffect, useState } from 'react'

export function useRealtimeOrder(orderId: string) {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) return

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`)
        const data = await res.json()
        if (data && !data.error) {
          setOrder(data)
        }
      } catch (error) {
        console.error("Error fetching order:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()

    // Polling every 5 seconds as a replacement for Realtime
    const interval = setInterval(fetchOrder, 5000)

    return () => clearInterval(interval)
  }, [orderId])

  return { order, loading }
}
