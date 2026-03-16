import mysql from 'mysql2/promise';
async function test() {
  const db = await mysql.createConnection('mysql://root:ZzOjAZKTGlNfBGxXzvrlEnAezyyMESBf@shortline.proxy.rlwy.net:53715/railway');
  const [rows] = await db.query('SHOW TABLES;');
  console.log('Tables in Railway DB:', rows);
  process.exit(0);
}
test();
