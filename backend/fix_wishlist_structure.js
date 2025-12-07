const { getDb } = require('./db');

async function fixWishlistStructure() {
    try {
        const db = await getDb();

        const wishlists = await db.all('SELECT * FROM wishlists');
        console.log(`Checking ${wishlists.length} wishlists...`);

        for (const w of wishlists) {
            try {
                let items = JSON.parse(w.items || '[]');
                let wChanged = false;

                items = items.map(item => {
                    let iChanged = false;

                    // Fix images if it's a string
                    if (item.images && typeof item.images === 'string') {
                        try {
                            item.images = JSON.parse(item.images);
                            iChanged = true;
                        } catch (e) {
                            console.error(`Error parsing images string for item ${item.id}`, e);
                        }
                    }

                    if (iChanged) wChanged = true;
                    return item;
                });

                if (wChanged) {
                    await db.run('UPDATE wishlists SET items = ? WHERE id = ?', [JSON.stringify(items), w.id]);
                    console.log(`Updated wishlist ${w.id} structure`);
                }
            } catch (e) {
                console.error(`Error parsing wishlist ${w.id}`, e);
            }
        }
        console.log('Wishlists structure updated.');

    } catch (e) {
        console.error(e);
    }
}

fixWishlistStructure();
