const { getDb } = require('./db');
const path = require('path');

async function checkOrders() {
    try {
        const db = await getDb();
        const orders = await db.all('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5');
        console.log('Orders found:', orders.length);
        console.log(JSON.stringify(orders, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

checkOrders();
