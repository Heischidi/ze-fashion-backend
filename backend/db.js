const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Helper to convert ? placeholders to $1, $2, etc.
function formatSql(sql) {
    let i = 1;
    return sql.replace(/\?/g, () => `$${i++}`);
}

const db = {
    get: async (sql, params = []) => {
        const res = await pool.query(formatSql(sql), params);
        return res.rows[0];
    },
    all: async (sql, params = []) => {
        const res = await pool.query(formatSql(sql), params);
        return res.rows;
    },
    run: async (sql, params = []) => {
        const res = await pool.query(formatSql(sql), params);
        return {
            lastID: res.rows.length > 0 ? res.rows[0].id : null,
            changes: res.rowCount
        };
    },
    exec: async (sql) => {
        await pool.query(sql);
    },
    close: async () => {
        await pool.end();
    }
};

async function getDb() {
    return db;
}

module.exports = { getDb };
