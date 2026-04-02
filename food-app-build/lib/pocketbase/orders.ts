import { query } from '@/lib/db';

export async function getUserOrders(userId?: string, phone?: string) {
    try {
        let sql = 'SELECT * FROM orders';
        let params: any[] = [];
        
        if (userId && phone) {
            sql += ' WHERE user_id = $1 OR phone = $2';
            params = [userId, phone];
        } else if (userId) {
            sql += ' WHERE user_id = $1';
            params = [userId];
        } else if (phone) {
            sql += ' WHERE phone = $1';
            params = [phone];
        } else {
            return [];
        }

        sql += ' ORDER BY created_at DESC';
        const res = await query(sql, params);
        return res.rows;
    } catch (error) {
        console.error('Error fetching user orders from SQL:', error);
        return [];
    }
}

export async function getUserReservations(userId?: string, phone?: string) {
    try {
        let sql = `
            SELECT r.*, res.name_kk as cafe_name, res.image_url as cafe_image
            FROM reservations r
            LEFT JOIN restaurants res ON r.cafe_id = res.id
        `;
        let params: any[] = [];

        if (userId && phone) {
            sql += ' WHERE r.user_id = $1 OR r.phone = $2';
            params = [userId, phone];
        } else if (userId) {
            sql += ' WHERE r.user_id = $1';
            params = [userId];
        } else if (phone) {
            sql += ' WHERE r.phone = $1';
            params = [phone];
        } else {
            return [];
        }

        sql += ' ORDER BY r.date DESC, r.time DESC';
        const res = await query(sql, params);

        // Map expected structure
        return res.rows.map(row => ({
            ...row,
            restaurants: {
                id: row.cafe_id,
                name: row.cafe_name,
                image_url: row.cafe_image
            }
        }));
    } catch (error) {
        console.error('Error fetching user reservations from SQL:', error);
        return [];
    }
}

export function subscribeToOrders(callback: () => void) {
    // PG Real-time would require a separate setup (LISTEN/NOTIFY)
    // For now, we return a no-op unsubscribe
    console.warn('subscribeToOrders: Real-time not yet implemented for SQL backend');
    return () => {};
}
