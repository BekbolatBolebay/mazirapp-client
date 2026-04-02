import pb from '@/utils/pocketbase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const {
            cafe_id,
            customer_name,
            customer_phone,
            date,
            time,
            guests_count,
            table_id,
            payment_method,
            notes,
            duration_hours = 1,
            customer_id,
            items = [],
        } = body

        if (!cafe_id || !customer_name || !customer_phone || !date || !time || !guests_count) {
            return NextResponse.json({ error: 'Барлық міндетті өрістерді толтырыңыз' }, { status: 400 })
        }

        // 0. Fetch restaurant settings to get booking_fee safely via PocketBase
        const restaurant = await pb.collection('restaurants').getOne(cafe_id)
        const booking_fee = Number(restaurant?.booking_fee || 0)

        // 1. Атомарлық тексеру: Бұл үстел осы уақытта бос па?
        if (table_id) {
            const existingReservations = await pb.collection('reservations').getFullList({
                filter: `table_id = "${table_id}" && date = "${date}" && (status = "pending" || status = "confirmed" || status = "awaiting_payment")`
            })

            if (existingReservations.length > 0) {
                const requestedStart = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1])
                const requestedEnd = requestedStart + (duration_hours * 60)

                const hasOverlap = existingReservations.some(res => {
                    const resStart = parseInt(res.time.split(':')[0]) * 60 + parseInt(res.time.split(':')[1])
                    const resEnd = resStart + (res.duration_hours * 60)
                    return requestedStart < resEnd && requestedEnd > resStart
                })

                if (hasOverlap) {
                    return NextResponse.json({
                        error: 'Кешіріңіз, бұл үстел таңдалған уақытта бос емес. Басқа уақыт немесе басқа үстел таңдаңыз.'
                    }, { status: 409 })
                }
            }
        }

        // Жалпы сомасын есептеу (тағамдар + брондау ақысы)
        const items_total = items.reduce(
            (sum: number, item: any) => sum + item.price * item.quantity,
            0
        )
        const total_amount = items_total + booking_fee

        // Резервация жасаймыз
        const reservation = await pb.collection('reservations').create({
            cafe_id,
            customer_name,
            customer_phone,
            date,
            time,
            guests_count,
            table_id: table_id || null,
            payment_method: payment_method || 'cash',
            notes: notes || null,
            duration_hours,
            customer_id: customer_id || null,
            total_amount,
            booking_fee,
            status: 'pending',
            payment_status: 'pending'
        })

        // Алдын ала тапсырылған тағамдарды жазамыз
        if (items.length > 0) {
            for (const item of items) {
                await pb.collection('reservation_items').create({
                    reservation_id: reservation.id,
                    menu_item_id: item.menu_item_id,
                    name_kk: item.name_kk,
                    name_ru: item.name_ru,
                    price: item.price,
                    quantity: item.quantity,
                })
            }
        }

        // Import notifyAdmin
        const { notifyAdmin } = await import('@/lib/actions')
        await notifyAdmin(reservation, 'booking', cafe_id)

        return NextResponse.json({ success: true, reservation })
    } catch (err: any) {
        console.error('API error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
