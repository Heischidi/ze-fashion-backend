const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

(async () => {
    const db = await open({
        filename: './backend/db.sqlite',
        driver: sqlite3.Database
    });

    console.log('Fixing data...');

    // 1. Ensure Categories Exist
    const categories = [
        { id: 1, name: 'Wardrobe', slug: 'wardrobe' },
        { id: 2, name: 'Curations', slug: 'curations' },
        { id: 3, name: 'Accents', slug: 'accents' }
    ];

    for (const cat of categories) {
        const existing = await db.get('SELECT * FROM categories WHERE slug = ?', [cat.slug]);
        if (!existing) {
            await db.run('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)', [cat.id, cat.name, cat.slug]);
            console.log(`Inserted category: ${cat.name}`);
        } else {
            console.log(`Category exists: ${cat.name} (ID: ${existing.id})`);
        }
    }

    // 2. Fix Products with String Category IDs
    const products = await db.all('SELECT id, category_id FROM products');
    for (const p of products) {
        let newId = null;
        if (p.category_id === 'wardrobe' || p.category_id === 'Wardrobe') newId = 1;
        else if (p.category_id === 'curations' || p.category_id === 'Curations') newId = 2;
        else if (p.category_id === 'accents' || p.category_id === 'Accents') newId = 3;

        if (newId) {
            await db.run('UPDATE products SET category_id = ? WHERE id = ?', [newId, p.id]);
            console.log(`Updated product ${p.id}: ${p.category_id} -> ${newId}`);
        }
    }

    console.log('Data fix complete.');
})();
