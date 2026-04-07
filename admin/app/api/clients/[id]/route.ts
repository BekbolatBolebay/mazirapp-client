import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyAuth } from '../../auth/utils'

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = await params

    if (!id) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // 1. Verify that the requester is an admin
    const auth = await verifyAuth(req)

    if (!auth || auth.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 })
    }

    try {
        // 2. Delete user and their profile from SQL
        // If there's a cascade, deleting from users might be enough.
        // But to be safe, we'll delete from staff_profiles first if it exists.
        
        await query('DELETE FROM staff_profiles WHERE user_id = $1', [id])
        await query('DELETE FROM users WHERE id = $1', [id])

        return NextResponse.json({ success: true, message: 'User deleted successfully' })
    } catch (error: any) {
        console.error('Error deleting user:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
