const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '12345678';
const DB_NAME = process.env.DB_NAME || 'smart_campus';
const DB_PORT = Number(process.env.DB_PORT || 3306);

let pool;

async function initPool() {
  // Create the database if it doesn't exist
  const serverConn = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
    multipleStatements: true,
  });
  await serverConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await serverConn.end();

  pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
  });

  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
  console.log(`[DB] Connected to MySQL database "${DB_NAME}"`);

  return pool;
}

// Initialize immediately
const poolPromise = initPool().catch((err) => {
  console.error('[DB] Initialization failed:', err.message);
});

module.exports = new Proxy(
  {},
  {
    get: function (_target, prop) {
      if (!pool) throw new Error('DB pool not initialized');
      return pool[prop];
    },
  }
);


