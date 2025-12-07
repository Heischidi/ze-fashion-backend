const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const DB_FILE = process.env.DATABASE_FILE || './db.sqlite';

async function addCategories() {
    const db = await open({
        filename: DB_FILE,
        driver: sqlite3.Database
    });

    try {
        const categories = [
            { name: 'Men', slug: 'men' },
            { name: 'Women', slug: 'women' },
            { name: 'Kids', slug: 'kids' },
            { name: 'Accessories', slug: 'accessory' },
            { name: 'Wardrobe', slug: 'wardrobe' },
            { name: 'Curations', slug: 'curations' },
            { name: 'Accents', slug: 'accents' }
        ];

        for (const cat of categories) {
            try {
                // Check if exists
                const existing = await db.get('SELECT id FROM categories WHERE slug = ?', [cat.slug]);
                if (!existing) {
                    await db.run('INSERT INTO categories (name, slug, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)', [cat.name, cat.slug]);
                    console.log(`Added category: ${cat.name}`);
                } else {
                    console.log(`Category exists: ${cat.name}`);
                }
            } catch (e) {
                console.error(`Failed to add ${cat.name}:`, e.message);
            }
        }

        console.log('Categories updated.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await db.close();
    }
}

addCategories();
