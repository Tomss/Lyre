const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  });

  try {
    console.log('Adding end_time column to events table...');
    await pool.query('ALTER TABLE events ADD COLUMN end_time TIME NULL');
    console.log('Migration successful: Column end_time added to events.');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column end_time already exists.');
    } else {
      console.error('Migration failed:', error);
    }
  } finally {
    await pool.end();
    process.exit(0);
  }
}

migrate();
