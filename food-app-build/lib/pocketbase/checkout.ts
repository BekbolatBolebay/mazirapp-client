import { query } from '@/lib/db';

export async function getRestaurantSettings(id: string) {
    try {
        const res = await query('SELECT * FROM restaurants WHERE id = $1', [id]);
        return res.rows[0] || null;
    } catch (error) {
        console.error('Error fetching restaurant settings from SQL:', error);
        return null;
    }
}

export async function getWorkingHours(cafeId: string) {
    try {
        const res = await query('SELECT * FROM working_hours WHERE cafe_id = $1', [cafeId]);
        return res.rows;
    } catch (error) {
        console.error('Error fetching working hours from SQL:', error);
        return [];
    }
}

export async function getUserCards(userId: string) {
    try {
        const res = await query('SELECT * FROM user_cards WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC', [userId]);
        return res.rows;
    } catch (error) {
        console.error('Error fetching user cards from SQL:', error);
        return [];
    }
}

export async function getTables(cafeId: string) {
    try {
        const res = await query('SELECT * FROM restaurant_tables WHERE cafe_id = $1 AND is_active = true', [cafeId]);
        return res.rows;
    } catch (error) {
        console.error('Error fetching tables from SQL:', error);
        return [];
    }
}

export async function getCheckoutMenu(cafeId: string) {
    try {
        const categoriesRes = await query(
            'SELECT * FROM categories WHERE cafe_id = $1 AND is_active = true ORDER BY sort_order',
            [cafeId]
        );
        const itemsRes = await query(
            'SELECT * FROM menu_items WHERE cafe_id = $1 AND is_available = true ORDER BY sort_order',
            [cafeId]
        );
        return { categories: categoriesRes.rows, items: itemsRes.rows };
    } catch (error) {
        console.error('Error fetching checkout menu from SQL:', error);
        return { categories: [], items: [] };
    }
}

export async function getAllReservations(cafeId: string) {
    try {
        const res = await query(
            'SELECT id, table_number as table_id, date, time, status FROM reservations WHERE cafe_id = $1',
            [cafeId]
        );
        return res.rows;
    } catch (error) {
        console.error('Error fetching all reservations from SQL:', error);
        return [];
    }
}

export async function createReservation(data: any, items: any[]) {
    try {
        const res = await query(
            `INSERT INTO reservations (user_id, cafe_id, date, time, guests, status, booking_fee, payment_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [data.user_id, data.cafe_id, data.date, data.time, data.guests, data.status || 'pending', data.booking_fee || 0, data.payment_status || 'pending']
        );
        
        const reservation = res.rows[0];
        
        // Create items if reservation_items table exists
        for (const item of items) {
             await query(
                'INSERT INTO reservation_items (reservation_id, menu_item_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [reservation.id, item.menu_item_id, item.quantity, item.price]
            );
        }
        
        return reservation;
    } catch (error) {
        console.error('Error creating reservation in SQL:', error);
        throw error;
    }
}

export async function createOrder(data: any, items: any[]) {
    try {
        const res = await query(
            `INSERT INTO orders (user_id, cafe_id, status, total_amount, delivery_fee, address, phone, payment_method, payment_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [data.user_id, data.cafe_id, data.status || 'pending', data.total_amount, data.delivery_fee || 0, data.address, data.phone, data.payment_method, data.payment_status || 'pending']
        );
        
        const order = res.rows[0];
        
        for (const item of items) {
            await query(
                'INSERT INTO order_items (order_id, menu_item_id, name_ru, quantity, price) VALUES ($1, $2, $3, $4, $5)',
                [order.id, item.id || item.menu_item_id, item.name_ru || item.name, item.quantity, item.price]
            );
        }
        
        return order;
    } catch (error) {
        console.error('Error creating order in SQL:', error);
        throw error;
    }
}

export function subscribeToRestaurantSettings(id: string, callback: (data: any) => void) {
    console.warn('subscribeToRestaurantSettings: Real-time not yet implemented for SQL backend');
    return () => {};
}
