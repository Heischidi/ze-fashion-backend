const { getDb } = require('./backend/db');

async function migrate() {
    console.log('Starting Gift migration...');
    const db = await getDb();

    try {
        await db.run('ALTER TABLE orders ADD COLUMN is_gift INTEGER DEFAULT 0');
        console.log('Added is_gift column');
    } catch (e) {
        console.log('is_gift column might already exist:', e.message);
    }

    try {
        await db.run('ALTER TABLE orders ADD COLUMN gift_message TEXT');
        console.log('Added gift_message column');
    } catch (e) {
        console.log('gift_message column might already exist:', e.message);
    }

    console.log('Migration complete.');
}

migrate();
