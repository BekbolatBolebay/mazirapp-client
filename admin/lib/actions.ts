import pb from '@/utils/pocketbase'
import { revalidatePath } from 'next/cache'
import { getCurrentRestaurantId } from './db'
import { DEFAULT_CATEGORIES } from './constants'

export async function getDebugInfo() {
    const user = pb.authStore.model
    return {
        uid: user?.id,
        email: user?.email,
        role: user?.role
    }
}

// Стандартты категорияларды ресторанға қосу (бар болса қайталамайды)
export async function seedDefaultCategories(shouldRevalidate = true, restaurantId?: string) {
    const id = restaurantId || await getCurrentRestaurantId()
    if (!id) return { error: new Error('Unauthorized') }

    // Бар категорияларды алу
    try {
        const existing = await pb.collection('categories').getFullList({
            filter: `cafe_id="${id}"`,
            fields: 'name_kk',
        })

        const existingNames = new Set((existing || []).map((c: any) => c.name_kk))

        // Жоқ категорияларды ғана қосу
        const toInsert = DEFAULT_CATEGORIES
            .filter(c => !existingNames.has(c.name_kk))
            .map(c => ({
                name_kk: c.name_kk,
                name_ru: c.name_ru,
                name_en: c.name_en,
                sort_order: c.sort_order,
                cafe_id: id,
                is_active: true,
                icon_url: '',
                is_combo: c.name_kk === 'Комболар' || c.name_kk === 'Combo'
            }))

        if (toInsert.length === 0) return { error: null, added: 0 }

        const createPromises = toInsert.map(item => pb.collection('categories').create(item))
        await Promise.all(createPromises)

        return { error: null, added: toInsert.length }
    } catch (error) {
        console.error('Seed Categories Error:', error)
        return { error, added: 0 }
    }
}

export async function addMenuItem(payload: any, restaurantId?: string) {
    const id = restaurantId || await getCurrentRestaurantId()
    if (!id) return { data: null, error: new Error('Unauthorized') }

    try {
        const finalPayload = {
            ...payload,
            cafe_id: id,
        }

        const record = await pb.collection('menu_items').create(finalPayload)
        revalidatePath('/menu')
        return { data: record, error: null }
    } catch (error) {
        console.error('Add MenuItem Error:', error)
        return { data: null, error }
    }
}

export async function updateMenuItem(id: string, payload: any) {
    try {
        const record = await pb.collection('menu_items').update(id, payload)
        revalidatePath('/menu')
        return { data: record, error: null }
    } catch (error) {
        console.error('Update MenuItem Error:', error)
        return { data: null, error }
    }
}

export async function deleteMenuItem(id: string) {
    try {
        await pb.collection('menu_items').delete(id)
        revalidatePath('/menu')
        return { error: null }
    } catch (error) {
        console.error('Delete MenuItem Error:', error)
        return { error }
    }
}

export async function addCategory(payload: any, restaurantId?: string) {
    const id = restaurantId || await getCurrentRestaurantId()
    if (!id) return { data: null, error: new Error('Unauthorized') }

    try {
        const finalPayload = {
            ...payload,
            cafe_id: id
        }

        const record = await pb.collection('categories').create(finalPayload)
        revalidatePath('/menu')
        return { data: record, error: null }
    } catch (error) {
        console.error('Add Category Error:', error)
        return { data: null, error }
    }
}

export async function updateCategory(id: string, payload: any) {
    try {
        const record = await pb.collection('categories').update(id, payload)
        revalidatePath('/menu')
        return { data: record, error: null }
    } catch (error) {
        console.error('Update Category Error:', error)
        return { data: null, error }
    }
}

export async function deleteCategory(id: string) {
    try {
        await pb.collection('categories').delete(id)
        revalidatePath('/menu')
        return { error: null }
    } catch (error) {
        console.error('Delete Category Error:', error)
        return { error }
    }
}

export async function addTable(payload: any, restaurantId?: string) {
    const id = restaurantId || await getCurrentRestaurantId()
    if (!id) return { data: null, error: new Error('Unauthorized') }

    try {
        const finalPayload = {
            ...payload,
            cafe_id: id,
        }

        const record = await pb.collection('restaurant_tables').create(finalPayload)
        revalidatePath('/tables')
        return { data: record, error: null }
    } catch (error) {
        console.error('Add Table Error:', error)
        return { data: null, error }
    }
}

export async function updateTable(id: string, payload: any) {
    try {
        const record = await pb.collection('restaurant_tables').update(id, payload)
        revalidatePath('/tables')
        return { data: record, error: null }
    } catch (error) {
        console.error('Update Table Error:', error)
        return { data: null, error }
    }
}

export async function deleteTable(id: string) {
    try {
        await pb.collection('restaurant_tables').update(id, { is_active: false })
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
    const id = restaurantId || await getCurrentRestaurantId()
    if (!id) return { error: new Error('Unauthorized') }

    try {
        // 1. Get existing hours to delete them
        const existing = await pb.collection('working_hours').getFullList({
            filter: `cafe_id="${id}"`,
        })

        const deletePromises = existing.map(item => pb.collection('working_hours').delete(item.id))
        await Promise.all(deletePromises)

        // 2. Insert new hours
        const createPromises = hours.map(({ id: hourId, created_at, updated_at, ...h }) => {
            return pb.collection('working_hours').create({
                ...h,
                cafe_id: id
            })
        })

        await Promise.all(createPromises)
        revalidatePath('/profile')
        return { error: null }
    } catch (error) {
        console.error('Update Working Hours Error:', error)
        return { error }
    }
}

export async function updateCafeSettings(payload: any, restaurantId?: string) {
    const id = restaurantId || await getCurrentRestaurantId()
    if (!id) return { data: null, error: new Error('Unauthorized') }

    const user = pb.authStore.model
    if (!user) return { data: null, error: new Error('Unauthorized') }

    try {
        const record = await pb.collection('restaurants').update(id, payload)
        
        revalidatePath('/profile')
        revalidatePath('/') // Dashboard might display some settings
        revalidatePath(`/restaurant/${id}`)
        
        return { data: record, error: null }
    } catch (error) {
        console.error('Update Cafe Settings Error:', error)
        return { data: null, error }
    }
}
