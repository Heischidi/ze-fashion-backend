const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const path = require('path');
const DB_FILE = process.env.DATABASE_FILE || path.join(__dirname, 'db.sqlite');

let dbInstance = null;

async function getDb() {
    if (!dbInstance) {
        dbInstance = await open({
            filename: DB_FILE,
            driver: sqlite3.Database
        });
    }
    return dbInstance;
}

module.exports = { getDb };
