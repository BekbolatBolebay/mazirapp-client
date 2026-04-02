import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'
import { cookies } from 'next/headers'

export async function GET() {
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    const cookieStore = await cookies();
    const token = cookieStore.get('pb_auth')?.value;

    if (token) {
        pb.authStore.save(token, null);
    }

    if (!pb.authStore.isValid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = pb.authStore.model;
    return NextResponse.json({ user })
}

export async function PUT(req: NextRequest) {
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    const cookieStore = await cookies();
    const token = cookieStore.get('pb_auth')?.value;

    if (token) {
        pb.authStore.save(token, null);
    }

    if (!pb.authStore.isValid || !pb.authStore.model) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { full_name, phone } = body

        if (!full_name || !phone) {
            return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
        }

        const record = await pb.collection('users').update(pb.authStore.model.id, {
            name: full_name,
            phone: phone
        })

        return NextResponse.json({ success: true, user: record })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
