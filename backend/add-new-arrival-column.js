const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.sqlite');

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    console.log('Adding new_arrival column to products table...');

    // Add new_arrival column (simulating boolean with INTEGER 0/1)
    db.run("ALTER TABLE products ADD COLUMN new_arrival INTEGER DEFAULT 0", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('Column new_arrival already exists.');
            } else {
                console.error('Error adding column:', err.message);
            }
        } else {
            console.log('Successfully added new_arrival column.');
        }
    });

    // Verify
    db.all("PRAGMA table_info(products)", (err, rows) => {
        if (err) {
            console.error('Error verifying schema:', err);
        } else {
            const hasColumn = rows.some(r => r.name === 'new_arrival');
            console.log('Verification: new_arrival column exists?', hasColumn);
        }
        db.close();
    });
});
