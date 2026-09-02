const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkOrchestras() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  });

  try {
    const [cols] = await pool.query('DESCRIBE orchestras');
    console.log('Orchestras columns:', cols.map(c => `${c.Field} (${c.Type})`));

    const [rows] = await pool.query('SELECT id, name, photo_url FROM orchestras LIMIT 5');
    console.log('Sample orchestras:', rows);

    const [photoCols] = await pool.query('DESCRIBE orchestra_photos');
    console.log('Orchestra_photos columns:', photoCols.map(c => `${c.Field} (${c.Type})`));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkOrchestras();
