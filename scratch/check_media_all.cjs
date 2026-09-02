const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkMediaFiles() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  });

  try {
    const [media] = await pool.query(`
      SELECT mi.id, mi.title, mi.media_type, mf.file_name, mf.file_path, mf.file_type, mf.file_size
      FROM media_items mi
      LEFT JOIN media_files mf ON mi.id = mf.media_item_id
    `);
    console.log('Media files in DB:', JSON.stringify(media, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkMediaFiles();
