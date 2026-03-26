import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function dumpSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  });

  const tables = ['morceaux', 'partitions', 'activity_log'];
  
  for (const table of tables) {
    try {
      const [rows] = await connection.query(`SHOW CREATE TABLE ${table}`);
      console.log(`\n-- Table: ${table}`);
      console.log((rows as any)[0]['Create Table'] + ';');
    } catch (e) {
      console.log(`\n-- Table: ${table} NOT FOUND or error: ${e.message}`);
    }
  }

  await connection.end();
}

dumpSchema();
