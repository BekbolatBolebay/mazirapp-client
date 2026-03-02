import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const {
            restaurant_id,
            customer_name,
            customer_phone,
            date,
            time,
            guests_count,
            notes,
            items = [],
        } = body

        if (!restaurant_id || !customer_name || !customer_phone || !date || !time || !guests_count) {
            return NextResponse.json({ error: 'Барлық міндетті өрістерді толтырыңыз' }, { status: 400 })
        }

        const supabase = await createClient()

        // Жалпы сомасын есептеу
        const total_amount = items.reduce(
            (sum: number, item: any) => sum + item.price * item.quantity,
            0
        )

        // Резервация жасаймыз
        const { data: reservation, error: resError } = await supabase
            .from('reservations')
            .insert({
                restaurant_id,
                customer_name,
                customer_phone,
                date,
                time,
                guests_count,
                notes: notes || null,
                total_amount,
                status: 'pending',
            })
            .select()
            .single()

        if (resError) {
            console.error('Reservation insert error:', resError)
            return NextResponse.json({ error: resError.message }, { status: 500 })
        }

        // Алдын ала тапсырылған тағамдарды жазамыз
        if (items.length > 0) {
            const reservationItems = items.map((item: any) => ({
                reservation_id: reservation.id,
                menu_item_id: item.menu_item_id,
                name_kk: item.name_kk,
                name_ru: item.name_ru,
                price: item.price,
                quantity: item.quantity,
            }))

            const { error: itemsError } = await supabase
                .from('reservation_items')
                .insert(reservationItems)

            if (itemsError) {
                console.error('Reservation items insert error:', itemsError)
            }
        }

        return NextResponse.json({ success: true, reservation })
    } catch (err: any) {
        console.error('API error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
