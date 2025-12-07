const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const DB_FILE = process.env.DATABASE_FILE || './db.sqlite';

async function checkData() {
    const db = await open({
        filename: DB_FILE,
        driver: sqlite3.Database
    });

    try {
        console.log('--- Categories ---');
        const categories = await db.all('SELECT * FROM categories');
        console.log(JSON.stringify(categories, null, 2));

        console.log('\n--- Products (Last 10) ---');
        const products = await db.all('SELECT id, title, category_id FROM products ORDER BY id DESC LIMIT 10');
        console.log(JSON.stringify(products, null, 2));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await db.close();
    }
}

checkData();
