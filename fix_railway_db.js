import mysql from 'mysql2/promise';

async function checkRailway() {
  const dbUrl = 'mysql://root:ZzOjAZKTGlNfBGxXzvrlEnAezyyMESBf@shortline.proxy.rlwy.net:53715/railway';
  try {
    const connection = await mysql.createConnection(dbUrl);
    
    // Check users table schema
    const [rows] = await connection.query('DESCRIBE users;');
    console.log('Users table schema:', rows);
    
    // Fix password_hash to be nullable if it isn't
    await connection.query('ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL;');
    console.log('Successfully modified password_hash to be NULLABLE in production.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRailway();
