import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import pb from '@/utils/pocketbase'
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

  useEffect(() => {
    // Initial sync
    const syncAuth = async () => {
      try {
        // First try the new system (JWT cookie)
        // We'll rely on server-side initial data if possible, 
        // but for client-side we can check the cookie via an API or just check if pb is still used.
        // The user mentioned migration to SQL/JWT.
        
        if (pb.authStore.isValid) {
          const model = pb.authStore.model
          setUser(model)
          setProfile({
            id: model?.id || '',
            full_name: model?.name || model?.full_name || '',
            avatar_url: model?.avatar ? pb.files.getUrl(model, model.avatar) : null,
            phone: model?.phone || '',
            is_anonymous: model?.is_anonymous || false,
            role: model?.role || 'user',
            updated_at: model?.updated || null,
          })
        } else {
          // Check for JWT token via an API call or similar mechanism if needed
          // For now, if PB is invalid, we assume not logged in or using JWT only on server side.
          setUser(null)
          setProfile(null)
        }
      } catch (err) {
        console.error('Sync auth error:', err)
      } finally {
        setLoading(false)
      }
    }

    syncAuth()

    // Listen for auth changes (PB)
    const unsubscribe = pb.authStore.onChange(() => {
      syncAuth()
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    await pb.collection('users').authWithPassword(email, password)
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      name: fullName,
    })
    await signIn(email, password)
  }

  const signInWithCustomOtp = async (email: string, fullName: string, phone: string) => {
    await sendCustomOtp(email, fullName, phone)
  }

  const verifyCustomOtp = async (email: string, code: string) => {
    const result = await verifyOtpAction(email, code)
    if (result.success && result.user) {
        setUser(result.user)
        setProfile({
            id: result.user.id,
            full_name: result.user.full_name,
            avatar_url: result.user.avatar_url,
            phone: result.user.phone,
            is_anonymous: false,
            role: result.user.role,
            updated_at: result.user.updated_at,
        })
    }
  }

  const signInAnonymous = async () => {
    // Guest logic can stay as is or be migrated to SQL
    throw new Error('Anonymous sign-in not yet implemented for SQL system')
  }

  const signOut = async () => {
    await signOutAction()
    pb.authStore.clear()
    setUser(null)
    setProfile(null)
    router.push('/')
  }

  const updateProfile = async (data: { fullName?: string; phone?: string; avatar?: File }) => {
    if (!user) return
    
    const formData = new FormData()
    if (data.fullName) formData.append('name', data.fullName)
    if (data.phone) formData.append('phone', data.phone)
    if (data.avatar) formData.append('avatar', data.avatar)
    
    await pb.collection('users').update(user.id, formData)
  }

  const subscribeToPush = async () => {
    try {
      const { getFcmToken } = await import('@/lib/firebase')
      const token = await getFcmToken()
      if (token && user) {
        // Update both if possible, or just the one being used
        if (user.id.length > 20) { // Likely UUID from SQL
             // We need an API for this
        } else {
            await pb.collection('users').update(user.id, {
                fcm_token: token,
                updated_at: new Date().toISOString()
            })
        }
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
