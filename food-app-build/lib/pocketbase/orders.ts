import { query } from '@/lib/db';
import { pb } from './client';

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
            FROM public.reservations r
            LEFT JOIN public.restaurants res ON r.cafe_id = res.id
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
        return res.rows.map((row: any) => ({
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

export async function subscribeToOrders(callback: (data: any) => void) {
    try {
        // Remove 'use server' if this is called from client components
        // Note: For real-time, the client should call pb.collection directly.
        // This wrapper is for consistent API usage.
        const unsubscribe = await pb.collection('orders').subscribe('*', (e) => {
            callback(e.record);
        });
        return unsubscribe;
    } catch (error) {
        console.error('Error subscribing to orders in PocketBase:', error);
        return () => {};
    }
}
