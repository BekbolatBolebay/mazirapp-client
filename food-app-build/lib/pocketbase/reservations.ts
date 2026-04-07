'use server'

import { query } from '@/lib/db';

export async function getReservationDetails(id: string) {
    try {
        const res = await query(
            `SELECT r.*, res.name_kk as cafe_name, res.image_url as cafe_image, t.table_number
             FROM public.reservations r
             LEFT JOIN public.restaurants res ON r.cafe_id = res.id
             LEFT JOIN public.restaurant_tables t ON r.table_id = t.id
             WHERE r.id = $1`,
            [id]
        );

        if (res.rowCount === 0) return null;
        
        const reservation = res.rows[0];
        
        // Fetch items
        const itemsRes = await query(
            'SELECT * FROM reservation_items WHERE reservation_id = $1',
            [id]
        );

        return {
            ...reservation,
            restaurants: {
                id: reservation.cafe_id,
                name: reservation.cafe_name,
                image_url: reservation.cafe_image
            },
            reservation_items: itemsRes.rows,
            tables: {
                id: reservation.table_id,
                table_number: reservation.table_number
            }
        };
    } catch (error) {
        console.error('Error fetching reservation from SQL:', error);
        return null;
    }
}

export async function getReservationReview(reservationId: string) {
    try {
        const res = await query('SELECT * FROM public.reviews WHERE reservation_id = $1', [reservationId]);
        return res.rows[0] || null;
    } catch (error) {
        return null;
    }
}

export async function subscribeToReservation(id: string, callback: (data: any) => void) {
    console.warn('subscribeToReservation: Real-time not yet implemented for SQL backend');
    return () => {};
}
