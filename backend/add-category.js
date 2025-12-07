const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');

db.run('ALTER TABLE products ADD COLUMN category TEXT DEFAULT "wardrobe"', (err) => {
    if (err) {
        console.error('Error adding category column:', err.message);
    } else {
        console.log('✅ Category column added successfully!');
    }
    db.close();
});
