const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const DB_FILE = process.env.DATABASE_FILE || './db.sqlite';

async function fixProductCategories() {
    const db = await open({
        filename: DB_FILE,
        driver: sqlite3.Database
    });

    try {
        console.log('Checking for products with string category_ids...');
        const products = await db.all('SELECT id, title, category_id FROM products');

        // Map string categories to IDs
        const catMap = {
            'men': 7,
            'women': 8,
            'kids': 9,
            'accessory': 10
        };

        for (const p of products) {
            // Check if category_id looks like one of our target strings or is a string in general
            if (typeof p.category_id === 'string' && catMap[p.category_id.toLowerCase()]) {
                const newId = catMap[p.category_id.toLowerCase()];
                console.log(`Fixing product ${p.id} (${p.title}): '${p.category_id}' -> ${newId}`);
                await db.run('UPDATE products SET category_id = ? WHERE id = ?', [newId, p.id]);
            }
        }

        console.log('Product categories fixed.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await db.close();
    }
}

fixProductCategories();
