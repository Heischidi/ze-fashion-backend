const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

(async () => {
    const db = await open({
        filename: './backend/database.sqlite',
        driver: sqlite3.Database
    });

    console.log('--- TABLES ---');
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.table(tables);
})();
