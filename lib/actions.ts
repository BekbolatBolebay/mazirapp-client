'use server'

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
                chat_id: restaurant.telegram_chat_id,
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
