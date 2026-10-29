const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

// Sanitize connection string
let connectionString = (process.env.DATABASE_URL || '').trim();
if (connectionString.startsWith("psql '") && connectionString.endsWith("'")) {
  connectionString = connectionString.slice(6, -1);
} else if ((connectionString.startsWith("'") && connectionString.endsWith("'")) ||
           (connectionString.startsWith('"') && connectionString.endsWith('"'))) {
  connectionString = connectionString.slice(1, -1);
}
connectionString = connectionString.replace('&channel_binding=require', '');
 
const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  // Essential for serverless/cloud DBs
  connectionTimeoutMillis: 20000, // 10 seconds to allow for cold starts
  idleTimeoutMillis: 30000,       // Keep connections alive for 30s
  max: 10,                        // Max clients in pool.
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Connected to Neon PostgreSQL database');
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};