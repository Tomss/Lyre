const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkMedia() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  });

  try {
    const [items] = await pool.query('SELECT * FROM media_items ORDER BY created_at DESC LIMIT 10');
    console.log('Media items:', items);

    const [files] = await pool.query('SELECT * FROM media_files ORDER BY id DESC LIMIT 10');
    console.log('Media files:', files);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkMedia();
