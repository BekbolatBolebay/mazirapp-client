import { pb, getPbAdmin } from './client';
import { supabase } from '@/lib/supabase';

/** 
 * Мейрамхана мәліметтерін Supabase-тен алу (Public Data)
 */
export async function getRestaurantSettings(id: string) {
    try {
        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching restaurant settings from Supabase:', error);
        return null;
    }
}

/** 
 * Жұмыс уақытын Supabase-тен алу
 */
export async function getWorkingHours(cafeId: string) {
    try {
        const { data, error } = await supabase
            .from('working_hours')
            .select('*')
            .eq('cafe_id', cafeId);
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching working hours from Supabase:', error);
        return [];
    }
}

/** 
 * Пайдаланушының карталарын PocketBase-тен алу (Sensitive Data)
 */
export async function getUserCards(userId: string) {
    try {
        const adminPb = await getPbAdmin();
        const records = await adminPb.collection('user_cards').getFullList({
            filter: `user_id = "${userId}" && is_active = true`,
            sort: '-created'
        });
        return records;
    } catch (error) {
        console.error('Error fetching user cards from PocketBase:', error);
        return [];
    }
}

/** 
 * Үстелдерді Supabase-тен алу
 */
export async function getTables(cafeId: string) {
    try {
        const { data, error } = await supabase
            .from('restaurant_tables')
            .select('*')
            .eq('cafe_id', cafeId)
            .eq('is_active', true);
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching tables from Supabase:', error);
        return [];
    }
}

/** 
 * Мәзір мен санаттарды Supabase-тен алу (Үлкен деректер үшін тиімді)
 */
export async function getCheckoutMenu(cafeId: string) {
    try {
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('*')
            .eq('cafe_id', cafeId)
            .eq('is_active', true)
            .order('sort_order');

        const { data: items, error: itemError } = await supabase
            .from('menu_items')
            .select('*')
            .eq('cafe_id', cafeId)
            .eq('is_available', true)
            .order('sort_order');

        if (catError || itemError) throw catError || itemError;
        
        return { categories: categories || [], items: items || [] };
    } catch (error) {
        console.error('Error fetching checkout menu from Supabase:', error);
        return { categories: [], items: [] };
    }
}

/** 
 * Барлық брондауларды PocketBase-тен алу
 */
export async function getAllReservations(cafeId: string) {
    try {
        const adminPb = await getPbAdmin();
        const records = await adminPb.collection('reservations').getFullList({
            filter: `cafe_id = "${cafeId}"`,
            sort: '-created'
        });
        return records;
    } catch (error) {
        console.error('Error fetching all reservations from PocketBase:', error);
        return [];
    }
}

/** 
 * Брондау жасау - PocketBase-те сақталады (Жеке деректер мен уақыт)
 */
export async function createReservation(data: any, items: any[]) {
    try {
        const adminPb = await getPbAdmin();
        const reservation = await adminPb.collection('reservations').create({
            ...data,
            status: data.status || 'pending',
            payment_status: data.payment_status || 'pending'
        });
        
        // Брондау тағамдарын сақтау
        for (const item of items) {
             await adminPb.collection('reservation_items').create({
                reservation_id: reservation.id,
                menu_item_id: item.menu_item_id,
                quantity: item.quantity,
                price: item.price
            });
        }
        
        return reservation;
    } catch (error) {
        console.error('Error creating reservation in PocketBase:', error);
        throw error;
    }
}

/** 
 * Тапсырыс жасау - PocketBase-те сақталады (Мекенжай, телефон және төлем)
 */
export async function createOrder(data: any, items: any[]) {
    try {
        const adminPb = await getPbAdmin();
        const order = await adminPb.collection('orders').create({
            user_id: data.user_id,
            cafe_id: data.cafe_id,
            status: data.status || 'pending',
            total_amount: data.total_amount,
            delivery_fee: data.delivery_fee || 0,
            address: data.address, // Жеке дерек - PocketBase-те қауіпсіз
            phone: data.phone,     // Жеке дерек - PocketBase-те қауіпсіз
            payment_method: data.payment_method,
            payment_status: data.payment_status || 'pending'
        });
        
        // Тапсырыс тағамдары
        for (const item of items) {
            await adminPb.collection('order_items').create({
                order_id: order.id,
                menu_item_id: item.id || item.menu_item_id,
                name_ru: item.name_ru || item.name,
                quantity: item.quantity,
                price: item.price
            });
        }
        
        return order;
    } catch (error) {
        console.error('Error creating order in PocketBase:', error);
        throw error;
    }
}

/** 
 * PocketBase-тегі жаңартуларға жазылу (Real-time)
 */
export async function subscribeToRestaurantSettings(id: string, callback: (data: any) => void) {
    try {
        const unsubscribe = await pb.collection('restaurants').subscribe(id, (e) => {
            callback(e.record);
        });
        return unsubscribe;
    } catch (error) {
        console.error('Error subscribing in PocketBase:', error);
        return () => {};
    }
}
