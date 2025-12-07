const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');

db.run('UPDATE products SET category = "wardrobe" WHERE category IS NULL OR category = ""', (err) => {
    if (err) {
        console.error('Error updating products:', err.message);
    } else {
        console.log('✅ All existing products updated to wardrobe category!');

        // Verify the update
        db.all('SELECT id, title, category FROM products LIMIT 5', (err, rows) => {
            if (err) {
                console.error('Error:', err.message);
            } else {
                console.log('\nFirst 5 products:');
                console.log(JSON.stringify(rows, null, 2));
            }
            db.close();
        });
    }
});
