import pb from '@/utils/pocketbase'
import ProfileClient from './profile-client'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
    const user = pb.authStore.model

    if (!user) {
        redirect('/login')
    }

    // Check if user is anonymous (guest)
    if (user.is_anonymous) {
        redirect('/login?next=/profile')
    }

    // In PocketBase, profile is the user record itself
    const profile = user

    const restaurant = await pb.collection('restaurants')
        .getFirstListItem(`owner_id = "${user.id}"`)
        .catch(() => null)

    return <ProfileClient user={user} profile={profile} restaurant={restaurant} />
}
