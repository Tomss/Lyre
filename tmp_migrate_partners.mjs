import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

await db.query('ALTER TABLE partners MODIFY logo_url text NULL');
console.log('partners schema updated: logo_url is now nullable');
process.exit(0);
