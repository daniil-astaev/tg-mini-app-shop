import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Создаем/открываем БД
const db = new Database(join(__dirname, 'orders.db'));

// Создаем таблицу заказов, если её нет
db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        items TEXT NOT NULL,
        total REAL NOT NULL,
        phone TEXT,
        telegram TEXT,
        comment TEXT,
        created_at TEXT NOT NULL,
        status TEXT DEFAULT 'new'
    )
`);

// Функция сохранения заказа
export function saveOrder(orderData) {
    const stmt = db.prepare(`
        INSERT INTO orders (
            user_id, username, first_name, last_name,
            items, total, phone, telegram, comment, created_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
        orderData.user_id,
        orderData.username || null,
        orderData.first_name || null,
        orderData.last_name || null,
        JSON.stringify(orderData.items),
        orderData.total,
        orderData.phone || null,
        orderData.telegram || null,
        orderData.comment || null,
        orderData.created_at,
        orderData.status || 'new'
    );

    return result.lastInsertRowid;
}

// Получить последние N заказов
export function getRecentOrders(limit = 10) {
    const stmt = db.prepare(`
        SELECT * FROM orders 
        ORDER BY created_at DESC 
        LIMIT ?
    `);
    return stmt.all(limit);
}

// Получить статистику
export function getStats() {
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get();
    const totalRevenue = db.prepare('SELECT SUM(total) as total FROM orders').get();
    const todayOrders = db.prepare(`
        SELECT COUNT(*) as count FROM orders 
        WHERE DATE(created_at) = DATE('now')
    `).get();

    return {
        totalOrders: totalOrders.count,
        totalRevenue: totalRevenue.total || 0,
        todayOrders: todayOrders.count
    };
}

// Получить заказ по ID
export function getOrderById(id) {
    const stmt = db.prepare('SELECT * FROM orders WHERE id = ?');
    return stmt.get(id);
}

// Обновить статус заказа
export function updateOrderStatus(id, status) {
    const stmt = db.prepare('UPDATE orders SET status = ? WHERE id = ?');
    return stmt.run(status, id);
}

export default db;
