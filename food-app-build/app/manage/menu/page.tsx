export const dynamic = 'force-dynamic'
import { getMenuItems, getMenuCategories, getCurrentRestaurantId } from '@/lib/cafe-db'
import { verifyAdmin } from '@/lib/auth/admin'
import { redirect } from 'next/navigation'
import MenuClient from './menu-client'

export default async function ManageMenuPage() {
    const { authorized, user } = await verifyAdmin()
    if (!authorized || !user) redirect('/login')

    const rid = await getCurrentRestaurantId(user.id)
    if (!rid) redirect('/manage')

    const [items, categories] = await Promise.all([
        getMenuItems(rid),
        getMenuCategories(rid)
    ])

    return <MenuClient initialItems={items} initialCategories={categories} />
}
