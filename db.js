// backend/db.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Neon
});

// Handle unexpected errors so Node doesn’t crash
pool.on('error', (err) => {
  console.error('❌ Unexpected DB error:', err);
});

module.exports = pool;
