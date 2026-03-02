import { createClient } from '@/lib/supabase/server'
import ProfileClient from './profile-client'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id, name_ru, name_kk')
        .eq('owner_id', user.id)
        .single()

    return <ProfileClient user={user} profile={profile} restaurant={restaurant} />
}
