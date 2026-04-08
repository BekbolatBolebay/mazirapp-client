'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendCustomOtp, verifyCustomOtp as verifyOtpAction, signOut as signOutAction } from './auth-actions'

type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  is_anonymous: boolean
  role: 'admin' | 'super_admin' | 'user' | null
  updated_at: string | null
}

type AuthContextType = {
  user: any | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signInWithCustomOtp: (email: string, fullName: string, phone: string) => Promise<void>
  verifyCustomOtp: (email: string, code: string) => Promise<void>
  signInAnonymous: () => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: { fullName?: string; phone?: string; avatar?: File }) => Promise<void>
  subscribeToPush: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const syncAuth = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        setProfile(data)
      } else {
        setUser(null)
        setProfile(null)
      }
    } catch (err) {
      console.error('Sync auth error:', err)
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    syncAuth()
  }, [])

  const signIn = async (email: string, password: string) => {
    // Legacy support or new password login
    throw new Error('Password login not yet implemented for SQL system')
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    throw new Error('Registration via password not yet implemented for SQL system')
  }

  const signInWithCustomOtp = async (email: string, fullName: string, phone: string) => {
    await sendCustomOtp(email, fullName, phone)
  }

  const verifyCustomOtp = async (email: string, code: string) => {
    const result = await verifyOtpAction(email, code)
    if (result.success && result.user) {
        await syncAuth()
    }
  }

  const signInAnonymous = async () => {
    throw new Error('Anonymous sign-in not yet implemented for SQL system')
  }

  const signOut = async () => {
    await signOutAction()
    setUser(null)
    setProfile(null)
    router.push('/')
  }

  const updateProfile = async (data: { fullName?: string; phone?: string; avatar?: File }) => {
    const formData = new FormData()
    if (data.fullName) formData.append('fullName', data.fullName)
    if (data.phone) formData.append('phone', data.phone)
    if (data.avatar) formData.append('avatar', data.avatar)
    
    const res = await fetch('/api/profile/update', {
        method: 'POST',
        body: formData
    })
    
    if (res.ok) await syncAuth()
  }

  const subscribeToPush = async () => {
    try {
      const { getFcmToken } = await import('@/lib/firebase')
      const fcmToken = await getFcmToken()
      if (fcmToken) {
        await fetch('/api/profile/fcm-token', {
            method: 'POST',
            body: JSON.stringify({ fcmToken }),
            headers: { 'Content-Type': 'application/json' }
        })
      }
    } catch (error) {
      console.error('Error subscribing to push:', error)
    }
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading, signIn, signUp, signInWithCustomOtp, verifyCustomOtp, signInAnonymous, signOut, updateProfile, subscribeToPush
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
