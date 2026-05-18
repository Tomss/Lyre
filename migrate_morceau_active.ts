import pool from './server/db.ts';

async function migrate() {
  try {
    console.log('Adding is_active column to morceaux...');
    await pool.query('ALTER TABLE morceaux ADD COLUMN is_active BOOLEAN DEFAULT 1');
    console.log('Migration successful.');
  } catch (error) {
    if ((error as any).code === 'ER_DUP_FIELDNAME') {
      console.log('Column is_active already exists.');
    } else {
      console.error('Migration failed:', error);
    }
  } finally {
    process.exit(0);
  }
}

migrate();
