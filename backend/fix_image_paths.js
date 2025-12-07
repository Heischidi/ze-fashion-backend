const { getDb } = require('./db');

async function fixImagePaths() {
    try {
        const db = await getDb();

        // 1. Fix Products
        const products = await db.all('SELECT * FROM products');
        console.log(`Checking ${products.length} products...`);

        for (const p of products) {
            let changed = false;
            let newImages = [];

            // Fix images array
            try {
                const imgs = JSON.parse(p.images || '[]');
                newImages = imgs.map(img => {
                    if (img && !img.startsWith('/images/') && !img.startsWith('http')) {
                        return `/images/${img}`;
                    }
                    return img;
                });
                if (JSON.stringify(imgs) !== JSON.stringify(newImages)) changed = true;
            } catch (e) {
                console.error(`Error parsing images for product ${p.id}`, e);
            }

            if (changed) {
                await db.run('UPDATE products SET images = ? WHERE id = ?',
                    [JSON.stringify(newImages), p.id]);
                // console.log(`Updated product ${p.id}`);
            }
        }
        console.log('Products updated.');

        // 2. Fix Wishlists
        const wishlists = await db.all('SELECT * FROM wishlists');
        console.log(`Checking ${wishlists.length} wishlists...`);

        for (const w of wishlists) {
            try {
                let items = JSON.parse(w.items || '[]');
                let wChanged = false;

                items = items.map(item => {
                    let iChanged = false;
                    // Fix item.image if it exists
                    if (item.image && !item.image.startsWith('/images/') && !item.image.startsWith('http')) {
                        item.image = `/images/${item.image}`;
                        iChanged = true;
                    }
                    // Fix item.images
                    if (item.images && Array.isArray(item.images)) {
                        item.images = item.images.map(img => {
                            if (img && !img.startsWith('/images/') && !img.startsWith('http')) {
                                iChanged = true;
                                return `/images/${img}`;
                            }
                            return img;
                        });
                    }
                    if (iChanged) wChanged = true;
                    return item;
                });

                if (wChanged) {
                    await db.run('UPDATE wishlists SET items = ? WHERE id = ?', [JSON.stringify(items), w.id]);
                    console.log(`Updated wishlist ${w.id}`);
                }
            } catch (e) {
                console.error(`Error parsing wishlist ${w.id}`, e);
            }
        }
        console.log('Wishlists updated.');

        // 3. Fix Orders
        const orders = await db.all('SELECT * FROM orders');
        console.log(`Checking ${orders.length} orders...`);

        for (const o of orders) {
            try {
                let items = JSON.parse(o.items || '[]');
                let oChanged = false;

                items = items.map(item => {
                    let iChanged = false;
                    if (item.image && !item.image.startsWith('/images/') && !item.image.startsWith('http')) {
                        item.image = `/images/${item.image}`;
                        iChanged = true;
                    }
                    if (iChanged) oChanged = true;
                    return item;
                });

                if (oChanged) {
                    await db.run('UPDATE orders SET items = ? WHERE id = ?', [JSON.stringify(items), o.id]);
                    console.log(`Updated order ${o.id}`);
                }
            } catch (e) {
                console.error(`Error parsing order ${o.id}`, e);
            }
        }
        console.log('Orders updated.');

    } catch (e) {
        console.error(e);
    }
}

fixImagePaths();
