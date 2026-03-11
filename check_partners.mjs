import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const [rows] = await db.query('DESCRIBE orchestras');
fs.writeFileSync('orchestras_schema.txt', JSON.stringify(rows, null, 2));
process.exit(0);
