import pb from '@/utils/pocketbase'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const user = pb.authStore.model

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const record = await pb.collection('staff_profiles').getOne(user.id)
        return NextResponse.json({ profile: record })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const user = pb.authStore.model

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { full_name, phone } = await request.json()

        if (!full_name || !phone) {
            return NextResponse.json({ error: 'Full name and phone are required' }, { status: 400 })
        }

        // 1. Update staff_profiles collection in PocketBase
        await pb.collection('staff_profiles').update(user.id, {
            full_name,
            phone,
        })

        // 2. Sync with auth metadata if needed
        // In PocketBase, the 'users' collection often holds this info directly.
        // If staff_profiles is separate, we might also want to update the 'users' collection.
        try {
            await pb.collection('users').update(user.id, {
                name: full_name,
            })
        } catch (authError) {
            console.error('Error syncing auth metadata in PocketBase:', authError)
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Profile update error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
