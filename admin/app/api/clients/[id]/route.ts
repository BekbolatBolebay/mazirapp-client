import { NextRequest, NextResponse } from 'next/server'
import pb from '@/utils/pocketbase'

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = params.id

    if (!id) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // 1. Verify that the requester is an admin
    const user = pb.authStore.model

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Check if user has admin role in staff_profiles
        const profile = await pb.collection('staff_profiles').getOne(user.id)

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
        }

        // 2. Delete user from PocketBase 'users' collection
        // In PocketBase, deleting from 'users' usually handles its own records.
        // If staff_profiles is separate, we might need to delete it manually if no cascade.
        await pb.collection('users').delete(id)
        
        try {
            await pb.collection('staff_profiles').delete(id)
        } catch (e) {
            // Might have been deleted by cascade or didn't exist
        }

        return NextResponse.json({ success: true, message: 'User deleted successfully' })
    } catch (error: any) {
        console.error('Error deleting user:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
