import { NextResponse } from 'next/server'
import pb from '@/utils/pocketbase'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            email,
            password,
            cafeName,
            address,
            whatsapp,
            latitude,
            longitude,
            openTime,
            closeTime,
            selectedDays
        } = body

        // 1. Create User via PocketBase
        // Note: PocketBase 'users' collection usually has 'email', 'password', 'passwordConfirm', 'name'
        const userData = await pb.collection('users').create({
            email,
            password,
            passwordConfirm: password,
            name: cafeName,
        })

        const userId = userData.id

        // 1b. Create Staff Profile
        try {
            await pb.collection('staff_profiles').create({
                id: userId, // PocketBase user IDs are usually the same if you specify them or just use the created ID
                // If the IDs are different, we should link them. Assuming we use userId as the record ID or link it.
                // If it's a separate collection, we can just use userId as the ID if we want parity with Supabase.
                email: email,
                full_name: cafeName,
                role: 'admin'
            })
        } catch (profileError) {
            console.error('Registration Error (Profile):', profileError)
        }

        // 2. Create Restaurant
        const cafeData = await pb.collection('restaurants').create({
            name_kk: cafeName,
            name_ru: cafeName,
            name_en: cafeName,
            address: address,
            phone: whatsapp,
            owner_id: userId,
            status: 'open',
            is_open: true,
            city: 'Алматы',
            latitude: latitude,
            longitude: longitude,
        })

        if (!cafeData) {
            throw new Error('Failed to create restaurant record')
        }

        // 3. Create Default Working Hours
        const workingHoursPromises = [0, 1, 2, 3, 4, 5, 6].map((day) => {
            return pb.collection('working_hours').create({
                cafe_id: cafeData.id,
                day_of_week: day,
                open_time: openTime,
                close_time: closeTime,
                is_day_off: !selectedDays.includes(day),
            })
        })

        await Promise.all(workingHoursPromises)

        return NextResponse.json({
            success: true,
            message: 'Registration successful'
        })

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
