'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

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
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signInWithEmail: (email: string) => Promise<void>
  verifyEmailOtp: (email: string, token: string) => Promise<void>
  signInAnonymous: () => Promise<void>
  signOut: () => Promise<void>
  subscribeToPush: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const supabase = createClient()

    // 1. Try to fetch from the CUSTOMERS table (PWA clients)
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', userId)
      .single()

    // 2. Try to fetch from the USERS table (Cafe Admins)
    const { data: adminData, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    let mergedProfile: Profile | null = null

    if (customerData) {
      mergedProfile = {
        id: customerData.id,
        full_name: customerData.full_name,
        avatar_url: customerData.avatar_url,
        phone: customerData.phone,
        is_anonymous: customerData.is_anonymous || false,
        role: (adminData?.role as any) || 'user', // Use admin role if they are also an admin
        updated_at: customerData.updated_at
      }
    } else if (adminData) {
      mergedProfile = {
        id: adminData.id,
        full_name: adminData.full_name,
        avatar_url: null,
        phone: null,
        is_anonymous: false,
        role: adminData.role || 'admin',
        updated_at: adminData.updated_at
      }
    }

    setProfile(mergedProfile)
    setLoading(false)
  }

  const signIn = async (email: string, password: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })
    if (error) throw error
  }

  const signInWithEmail = async (email: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true
      }
    })
    if (error) throw error
  }

  const verifyEmailOtp = async (email: string, token: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })
    if (error) throw error
    router.refresh()
  }

  const signInAnonymous = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInAnonymously()
    if (error) throw error
  }

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      })

      // Store subscription in profile/DB
      if (user) {
        const supabase = createClient()
        await supabase
          .from('customers')
          .update({ push_subscription: subscription })
          .eq('id', user.id)
      }
    } catch (error) {
      console.error('Error subscribing to push:', error)
    }
  }

  const signOut = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading, signIn, signUp,
      signInWithEmail, verifyEmailOtp, signInAnonymous, subscribeToPush, signOut
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
