const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

(async () => {
    const db = await open({
        filename: './backend/db.sqlite',
        driver: sqlite3.Database
    });

    console.log('--- CATEGORIES ---');
    const categories = await db.all('SELECT * FROM categories');
    console.table(categories);
})();
