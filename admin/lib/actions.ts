'use server'

import { query } from './db'
import { revalidatePath } from 'next/cache'
import { getCurrentRestaurantId } from './db'
import { DEFAULT_CATEGORIES } from './constants'

export async function getDebugInfo() {
    // This will be updated once standalone auth is fully integrated
    return {
        uid: null,
        email: null,
        role: null
    }
}

// Стандартты категорияларды ресторанға қосу (бар болса қайталамайды)
export async function seedDefaultCategories(restaurantId: string) {
    if (!restaurantId) return { error: new Error('Unauthorized') }

    try {
        const existing = await query(
            'SELECT name_kk FROM public.categories WHERE cafe_id = $1',
            [restaurantId]
        )

        const existingNames = new Set(existing.rows.map((c: any) => c.name_kk))

        const toInsert = DEFAULT_CATEGORIES
            .filter(c => !existingNames.has(c.name_kk))

        if (toInsert.length === 0) return { error: null, added: 0 }

        for (const c of toInsert) {
            await query(
                `INSERT INTO public.categories (name_kk, name_ru, name_en, sort_order, cafe_id, is_active, icon_url, is_combo) 
                 VALUES ($1, $2, $3, $4, $5, true, '', $6)`,
                [c.name_kk, c.name_ru, c.name_en, c.sort_order, restaurantId, c.name_kk === 'Комболар' || c.name_kk === 'Combo']
            )
        }

        return { error: null, added: toInsert.length }
    } catch (error) {
        console.error('Seed Categories Error:', error)
        return { error, added: 0 }
    }
}

export async function addMenuItem(payload: any, restaurantId: string) {
    if (!restaurantId) return { data: null, error: new Error('Unauthorized') }

    try {
        const res = await query(
            `INSERT INTO public.menu_items (
                cafe_id, category_id, name_kk, name_ru, name_en, 
                description_kk, description_ru, description_en, 
                price, image_url, is_available, is_popular, sort_order
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
            [
                restaurantId, payload.category_id, payload.name_kk, payload.name_ru, payload.name_en,
                payload.description_kk, payload.description_ru, payload.description_en,
                payload.price, payload.image_url, payload.is_available ?? true, payload.is_popular ?? false,
                payload.sort_order || 0
            ]
        )
        revalidatePath('/menu')
        return { data: res.rows[0], error: null }
    } catch (error) {
        console.error('Add MenuItem Error:', error)
        return { data: null, error }
    }
}

export async function updateMenuItem(id: string, payload: any) {
    try {
        const keys = Object.keys(payload)
        const values = Object.values(payload)
        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ')

        const res = await query(
            `UPDATE public.menu_items SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id, ...values]
        )
        revalidatePath('/menu')
        return { data: res.rows[0], error: null }
    } catch (error) {
        console.error('Update MenuItem Error:', error)
        return { data: null, error }
    }
}

export async function deleteMenuItem(id: string) {
    try {
        await query('DELETE FROM public.menu_items WHERE id = $1', [id])
        revalidatePath('/menu')
        return { error: null }
    } catch (error) {
        console.error('Delete MenuItem Error:', error)
        return { error }
    }
}

export async function addCategory(payload: any, restaurantId: string) {
    if (!restaurantId) return { data: null, error: new Error('Unauthorized') }

    try {
        const res = await query(
            `INSERT INTO public.categories (cafe_id, name_kk, name_ru, name_en, sort_order, is_active, icon_url) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                restaurantId, payload.name_kk, payload.name_ru, payload.name_en, 
                payload.sort_order || 0, payload.is_active ?? true, payload.icon_url || ''
            ]
        )
        revalidatePath('/menu')
        return { data: res.rows[0], error: null }
    } catch (error) {
        console.error('Add Category Error:', error)
        return { data: null, error }
    }
}

export async function updateCategory(id: string, payload: any) {
    try {
        const keys = Object.keys(payload)
        const values = Object.values(payload)
        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ')

        const res = await query(
            `UPDATE public.categories SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id, ...values]
        )
        revalidatePath('/menu')
        return { data: res.rows[0], error: null }
    } catch (error) {
        console.error('Update Category Error:', error)
        return { data: null, error }
    }
}

export async function deleteCategory(id: string) {
    try {
        await query('DELETE FROM public.categories WHERE id = $1', [id])
        revalidatePath('/menu')
        return { error: null }
    } catch (error) {
        console.error('Delete Category Error:', error)
        return { error }
    }
}

export async function addTable(payload: any, restaurantId: string) {
    if (!restaurantId) return { data: null, error: new Error('Unauthorized') }

    try {
        const res = await query(
            `INSERT INTO public.restaurant_tables (cafe_id, name, capacity, is_active) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [restaurantId, payload.name, payload.capacity || 2, payload.is_active ?? true]
        )
        revalidatePath('/tables')
        return { data: res.rows[0], error: null }
    } catch (error) {
        console.error('Add Table Error:', error)
        return { data: null, error }
    }
}

export async function updateTable(id: string, payload: any) {
    try {
        const keys = Object.keys(payload)
        const values = Object.values(payload)
        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ')

        const res = await query(
            `UPDATE public.restaurant_tables SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id, ...values]
        )
        revalidatePath('/tables')
        return { data: res.rows[0], error: null }
    } catch (error) {
        console.error('Update Table Error:', error)
        return { data: null, error }
    }
}

export async function deleteTable(id: string) {
    try {
        await query('UPDATE public.restaurant_tables SET is_active = false WHERE id = $1', [id])
        revalidatePath('/tables')
        return { error: null }
    } catch (error) {
        console.error('Delete Table Error:', error)
        return { error }
    }
}

export async function notifyAdminTelegram(order: any, restaurant: any) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN || restaurant?.telegram_bot_token
    const chatId = restaurant?.telegram_chat_id

    if (!botToken || !chatId) return

    const orderId = order.id.slice(0, 8)
    const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mazir-admin.vercel.app'}/orders`
    const itemsText = order.order_items?.map((item: any) =>
        `- ${item.menu_items?.name_ru || item.menu_items?.name} x${item.quantity}`
    ).join('\n') || ''

    const isKk = restaurant.lang === 'kk'
    const message = isKk
        ? `🆕 *Жаңа тапсырыс #${orderId}*\n\n` +
        `👤 Клиент: ${order.customer_name || 'Клиент'}\n` +
        `📞 Телефон: ${order.customer_phone}\n` +
        `💰 Сомасы: ${order.total_amount} ₸\n` +
        `📍 Түрі: ${order.type === 'delivery' ? 'Жеткізу' : 'Алып кету'}\n\n` +
        `🛒 Тамақтар:\n${itemsText}\n\n` +
        `🔗 [Админ панелінде ашу](${adminUrl})`
        : `🆕 *Новый заказ #${orderId}*\n\n` +
        `👤 Клиент: ${order.customer_name || 'Клиент'}\n` +
        `📞 Телефон: ${order.customer_phone}\n` +
        `💰 Сумма: ${order.total_amount} ₸\n` +
        `📍 Тип: ${order.type === 'delivery' ? 'Доставка' : 'Самовывоз'}\n\n` +
        `🛒 Позиции:\n${itemsText}\n\n` +
        `🔗 [Открыть в админ панели](${adminUrl})`

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown',
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Telegram notification failed:', {
                status: response.status,
                error: errorData
            })
        }
    } catch (err) {
        console.error('Telegram notification network error:', err)
    }
}

export async function updateWorkingHours(hours: any[], restaurantId?: string) {
    if (!restaurantId) return { error: new Error('Unauthorized') }

    try {
        // 1. Delete existing hours
        await query('DELETE FROM public.working_hours WHERE cafe_id = $1', [restaurantId])

        // 2. Insert new hours
        for (const h of hours) {
            await query(
                `INSERT INTO public.working_hours (cafe_id, day_of_week, open_time, close_time, is_day_off) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [restaurantId, h.day_of_week, h.open_time, h.close_time, h.is_day_off]
            )
        }

        revalidatePath('/profile')
        return { error: null }
    } catch (error) {
        console.error('Update Working Hours Error:', error)
        return { error }
    }
}

export async function updateCafeSettings(payload: any, restaurantId?: string) {
    if (!restaurantId) return { data: null, error: new Error('Unauthorized') }

    try {
        const keys = Object.keys(payload)
        const values = Object.values(payload)
        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ')

        const res = await query(
            `UPDATE public.restaurants SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
            [restaurantId, ...values]
        )
        
        revalidatePath('/profile')
        revalidatePath('/') 
        revalidatePath(`/restaurant/${restaurantId}`)
        
        return { data: res.rows[0], error: null }
    } catch (error) {
        console.error('Update Cafe Settings Error:', error)
        return { data: null, error }
    }
}

export async function updateOrderStatus(id: string, payload: any) {
    try {
        const keys = Object.keys(payload)
        const values = Object.values(payload)
        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ')

        const res = await query(
            `UPDATE public.orders SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id, ...values]
        )
        revalidatePath('/orders')
        return { data: res.rows[0], error: null }
    } catch (error) {
        console.error('Update Order Status Error:', error)
        return { data: null, error }
    }
}

export async function updateReservationStatus(id: string, payload: any) {
    try {
        const keys = Object.keys(payload)
        const values = Object.values(payload)
        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ')

        const res = await query(
            `UPDATE public.reservations SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id, ...values]
        )
        revalidatePath('/orders')
        return { data: res.rows[0], error: null }
    } catch (error) {
        console.error('Update Reservation Status Error:', error)
        return { data: null, error }
    }
}
