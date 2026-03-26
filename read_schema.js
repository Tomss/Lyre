import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306
  });
  
  const tables = ['activity_log', 'morceaux', 'partitions'];
  for (const table of tables) {
    try {
      const [rows] = await connection.query(`SHOW CREATE TABLE ${table}`);
      console.log(`\n-- ${table}\n${rows[0]['Create Table']};`);
    } catch (e) {
      console.log(`\n-- ${table} error: ${e.message}`);
    }
  }
  await connection.end();
}
run();
