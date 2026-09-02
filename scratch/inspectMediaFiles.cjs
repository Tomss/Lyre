const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkMediaFiles() {
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

    console.log('--- MEDIA_FILES COLUMNS ---');
    const [cols] = await connection.query(`DESCRIBE media_files`);
    console.log(cols.map(c => c.Field));

    const [rows] = await connection.query(`SELECT * FROM media_files LIMIT 20`);
    console.log(`\nSample rows (${rows.length}):`);
    for (const r of rows) {
      console.log(r);
    }

  } catch (err) {
    console.error('DB Error:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkMediaFiles();
