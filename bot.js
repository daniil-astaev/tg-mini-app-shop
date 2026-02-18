import { Bot, Keyboard } from "grammy";
import { saveOrder, getRecentOrders, getStats } from "./database.js";

const bot = new Bot(process.env.BOT_TOKEN || "8549765271:AAEOOaZ5rbQzUNvMoUFAVOD6dnEi7g5ailY");

// Команды регистрируем ПЕРВЫМИ, чтобы они обрабатывались до общего обработчика сообщений

// Команда /start
bot.command("start", async (ctx) => {
    console.log(`Пользователь ${ctx.from.first_name} нажал /start`);

    // ВАЖНО: Замени на свой актуальный ngrok URL!
    const webAppUrl = process.env.WEB_APP_URL || "https://unenigmatically-punier-emmy.ngrok-free.dev";

    const keyboard = new Keyboard()
        .webApp("🛒 Открыть магазин", webAppUrl)
        .resized();

    await ctx.reply(
        "Привет! Твой персональный магазин готов.\n\n" +
        "Нажми кнопку ниже, чтобы открыть магазин.",
        { reply_markup: keyboard }
    );
});

// Команда для просмотра последних заказов
bot.command("orders", async (ctx) => {
    try {
        console.log("Команда /orders вызвана");
        const orders = getRecentOrders(10);
        console.log(`Найдено заказов: ${orders.length}`);
        
        if (orders.length === 0) {
            await ctx.reply("📭 Заказов пока нет.");
            return;
        }

        let message = `📋 Последние ${orders.length} заказов:\n\n`;
        
        orders.forEach((order, index) => {
            try {
                const items = JSON.parse(order.items);
                const itemsText = items.map(item => 
                    typeof item === 'string' ? item : `${item.name} (⭐${item.price})`
                ).join(", ");
                
                const date = new Date(order.created_at).toLocaleString("ru-RU");
                
                message += `${index + 1}. Заказ #${order.id}\n`;
                message += `   👤 ${order.first_name || ""} ${order.last_name || ""} (@${order.username || "нет"})\n`;
                message += `   📦 ${itemsText}\n`;
                message += `   💰 ${order.total} ⭐\n`;
                message += `   🕒 ${date}\n`;
                message += `   📞 ${order.phone || order.telegram || "нет контакта"}\n`;
                message += `   📊 Статус: ${order.status}\n\n`;
            } catch (e) {
                console.error(`Ошибка обработки заказа #${order.id}:`, e);
            }
        });

        await ctx.reply(message);
    } catch (e) {
        console.error("Ошибка в команде /orders:", e);
        await ctx.reply("❌ Ошибка при получении заказов. Проверь консоль бота.");
    }
});

// Команда для статистики
bot.command("stats", async (ctx) => {
    try {
        console.log("Команда /stats вызвана");
        const stats = getStats();
        console.log("Статистика:", stats);
        
        await ctx.reply(
            `📊 Статистика магазина:\n\n` +
            `📦 Всего заказов: ${stats.totalOrders}\n` +
            `💰 Общая сумма: ${stats.totalRevenue.toFixed(2)} ⭐\n` +
            `📅 Заказов сегодня: ${stats.todayOrders}`
        );
    } catch (e) {
        console.error("Ошибка в команде /stats:", e);
        await ctx.reply("❌ Ошибка при получении статистики. Проверь консоль бота.");
    }
});

// Обработчик web_app_data - данные из мини-аппа (регистрируем ПОСЛЕ команд)
bot.on("message", async (ctx) => {
    // Пропускаем команды - они уже обработаны выше
    if (ctx.message.text?.startsWith('/')) {
        return;
    }
    
    // Проверяем, есть ли web_app_data в сообщении
    if (ctx.message.web_app_data) {
        await handleWebAppData(ctx, ctx.message.web_app_data.data);
    }
});

// Функция обработки данных из web app
async function handleWebAppData(ctx, rawData) {
    console.log("--- НОВЫЙ ЗАКАЗ ---");

    try {
        const data = JSON.parse(rawData);
        console.log("Распарсенные данные:", JSON.stringify(data, null, 2));

        const items = Array.isArray(data.items) ? data.items : [];
        const total = data.total ?? 0;
        const createdAt = data.createdAt
            ? new Date(data.createdAt).toLocaleString("ru-RU")
            : new Date().toLocaleString("ru-RU");

        const itemsList = items.length
            ? items
                  .map((item) => {
                      // Поддержка как старого формата (строка), так и нового (объект)
                      if (typeof item === 'string') {
                          return `• ${item}`;
                      }
                      return `• ${item.name || item} — ⭐ ${item.price || ''}`;
                  })
                  .join("\n")
            : "Товары не указаны";

        const user = data.user ?? ctx.from;
        const contact = data.contact || {};

        // Сохраняем заказ в БД
        const orderId = saveOrder({
            user_id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            items: items,
            total: total,
            phone: contact.phone,
            telegram: contact.telegram,
            comment: contact.comment,
            created_at: data.createdAt || new Date().toISOString(),
            status: 'new'
        });

        console.log(`Заказ #${orderId} сохранен в БД`);

        let contactInfo = "";
        if (contact.phone || contact.telegram || contact.comment) {
            contactInfo = "\n\n📞 Контакты клиента:\n";
            if (contact.phone) contactInfo += `📱 Телефон: ${contact.phone}\n`;
            if (contact.telegram) contactInfo += `✈️ Telegram: ${contact.telegram}\n`;
            if (contact.comment) contactInfo += `💬 Комментарий: ${contact.comment}\n`;
        }

        await ctx.reply(
            `✅ Новый заказ #${orderId}\n\n` +
            `👤 Клиент: ${user.first_name || ""} ${user.last_name || ""} (@${user.username || "нет юзернейма"})\n` +
            `🕒 Время: ${createdAt}\n\n` +
            `📦 Товары:\n${itemsList}\n\n` +
            `💰 Итоговая сумма: ${total} ⭐` +
            contactInfo
        );
    } catch (e) {
        console.error("Ошибка парсинга JSON:", e);
        await ctx.reply("Ошибка: Бот получил данные, но не смог их прочитать.");
    }
}

bot.on("message:web_app_data", async (ctx) => {
    console.log("--- ОБРАБОТЧИК message:web_app_data СРАБОТАЛ ---");
    await handleWebAppData(ctx, ctx.message.web_app_data.data);
});

// Запуск бота только для локальной разработки
if (process.env.NODE_ENV !== 'production') {
    bot.start();
    console.log("Бот успешно запущен. Жду команду /start...");
    console.log("Доступные команды: /start, /orders, /stats");
}

// Export for Vercel
export default async function handler(req, res) {
    try {
        await bot.handleUpdate(req.body);
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error handling update:', error);
        res.status(500).send('Error');
    }
}