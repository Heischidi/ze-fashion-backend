const { getDb } = require('./backend/db');

(async () => {
    const db = await getDb();

    const cats = [
        { name: 'Men', slug: 'men' },
        { name: 'Women', slug: 'women' },
        { name: 'Kids', slug: 'kids' },
        { name: 'Accessories', slug: 'accessory' }
    ];

    for (const c of cats) {
        const existing = await db.get('SELECT * FROM categories WHERE slug = ?', [c.slug]);
        if (!existing) {
            await db.run('INSERT INTO categories (name, slug) VALUES (?, ?)', [c.name, c.slug]);
            console.log(`Added category: ${c.name}`);
        } else {
            console.log(`Category exists: ${c.name}`);
        }
    }

    // Optional: Try to fix products with NULL category_id if we can infer it? 
    // It's hard to infer without extra data, but since the user just added products via admin where the category value was passed but not saved (no ID), the category ID is lost.
    // However, the 'category' string MIGHT have been saved if I check the INSERT statement... 
    // Wait, the INSERT statement only saves 'category_id'. 
    // 'INSERT INTO products (..., category_id, ...) ...'
    // So the category info for those products is effectively lost (stored as NULL).
    // The user will have to edit them again.
})();
