import mysql from 'mysql2/promise';

async function migrateRailway() {
  const dbUrl = 'mysql://root:ZzOjAZKTGlNfBGxXzvrlEnAezyyMESBf@shortline.proxy.rlwy.net:53715/railway';
  console.log('Connecting to Railway Database...');
  
  try {
    const connection = await mysql.createConnection(dbUrl);
    
    console.log('Applying migrations for Phase 1...');
    
    // Add columns to users
    await connection.query('ALTER TABLE users ADD COLUMN activation_token VARCHAR(255) NULL;');
    console.log('Added activation_token to users.');
    
    await connection.query('ALTER TABLE users ADD COLUMN token_expires_at DATETIME NULL;');
    console.log('Added token_expires_at to users.');
    
    // Add column to profiles
    await connection.query("ALTER TABLE profiles ADD COLUMN status ENUM('Inactive', 'Invited', 'Active') DEFAULT 'Inactive';");
    console.log('Added status back to profiles.');
    
    console.log('Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('Column already exists, ignoring error:', error.message);
        process.exit(0);
    }
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateRailway();
