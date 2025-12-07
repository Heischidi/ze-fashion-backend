const { getDb } = require('./backend/db');

async function migrate() {
    console.log('Starting Recipient Email migration...');
    const db = await getDb();

    try {
        await db.run('ALTER TABLE orders ADD COLUMN recipient_email TEXT');
        console.log('Added recipient_email column');
    } catch (e) {
        console.log('recipient_email column might already exist:', e.message);
    }

    console.log('Migration complete.');
}

migrate();
