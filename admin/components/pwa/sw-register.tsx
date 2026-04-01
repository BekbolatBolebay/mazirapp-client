'use client'

import { useEffect } from 'react'

export function SWRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // In development, we want to ensure the latest worker is always used
      // and that it's actually registered to avoid timeouts
      console.log('[SWRegister] Checking/Registering Service Worker...')
      
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[SWRegister] Service Worker registration successful with scope: ', reg.scope)
          
          // Force update if in dev mode
          if (process.env.NODE_ENV === 'development') {
            reg.update()
          }
        })
        .catch((err) => {
          console.error('[SWRegister] Service Worker registration failed: ', err)
        })

      // Also ensure it's ready
      navigator.serviceWorker.ready.then((reg) => {
          console.log('[SWRegister] Service Worker is ready and active')
      })
    }
  }, [])

  return null
}
