const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const DB_FILE = process.env.DATABASE_FILE || './db.sqlite';

async function updateSchema() {
    console.log('Opening database...');
    const db = await open({
        filename: DB_FILE,
        driver: sqlite3.Database
    });

    try {
        console.log('Checking for is_verified column...');
        try {
            await db.exec('ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0');
            console.log('Added is_verified column.');
        } catch (e) {
            if (e.message.includes('duplicate column name')) {
                console.log('is_verified column already exists.');
            } else {
                throw e;
            }
        }

        console.log('Checking for verification_token column...');
        try {
            await db.exec('ALTER TABLE users ADD COLUMN verification_token TEXT');
            console.log('Added verification_token column.');
        } catch (e) {
            if (e.message.includes('duplicate column name')) {
                console.log('verification_token column already exists.');
            } else {
                throw e;
            }
        }

        // Add avatar column
        console.log('Checking for avatar column...');
        try {
            await db.exec('ALTER TABLE users ADD COLUMN avatar TEXT');
            console.log('Added avatar column.');
        } catch (e) {
            if (e.message.includes('duplicate column name')) {
                console.log('avatar column already exists.');
            } else {
                throw e;
            }
        }

        // Optional: Mark existing users as verified so they don't get locked out
        console.log('Marking existing users as verified...');
        await db.run('UPDATE users SET is_verified = 1 WHERE is_verified = 0 AND verification_token IS NULL');
        console.log('Existing users updated.');

    } catch (err) {
        console.error('Schema update failed:', err);
    } finally {
        await db.close();
        console.log('Database closed.');
        console.log('Schema update complete');
    }
}

updateSchema();
