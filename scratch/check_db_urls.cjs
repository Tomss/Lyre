const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUrls() {
  let connection;
  try {
    if (process.env.DATABASE_URL) {
      connection = await mysql.createConnection(process.env.DATABASE_URL);
    } else {
      connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306', 10),
        user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
        password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'lyre_db'
      });
    }

    console.log('--- DB URL CHECK ---');
    const tables = [
      { name: 'site_settings', cols: ['setting_key', 'setting_value'] },
      { name: 'page_headers', cols: ['page_slug', 'image_url'] },
      { name: 'carousel_images', cols: ['title', 'image_url'] },
      { name: 'history_events', cols: ['title', 'image_url'] },
      { name: 'media_files', cols: ['title', 'url'] },
      { name: 'events', cols: ['title', 'image_url'] },
      { name: 'partitions', cols: ['nom', 'file_path'] },
      { name: 'orchestras', cols: ['name', 'photo_url'] }
    ];

    for (const t of tables) {
      try {
        const [rows] = await connection.query(`SELECT * FROM \`${t.name}\` LIMIT 10`);
        console.log(`\nTable [${t.name}]: ${rows.length} rows`);
        for (const r of rows) {
          const keyVal = r[t.cols[0]];
          const urlVal = r[t.cols[1]];
          if (urlVal) {
            console.log(`  - ${keyVal}: ${urlVal}`);
          }
        }
      } catch (e) {
        console.log(`Table ${t.name}: ${e.message}`);
      }
    }

  } catch (err) {
    console.error('DB Error:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkUrls();
