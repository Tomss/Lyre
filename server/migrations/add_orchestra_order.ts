
import pool from '../db';

const migrate = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to database.');

        // Check if column exists
        const [columns] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'orchestras' 
      AND COLUMN_NAME = 'display_order'
    `);

        // @ts-ignore
        if (columns[0].count === 0) {
            console.log('Adding display_order column...');
            await connection.query(`
        ALTER TABLE orchestras 
        ADD COLUMN display_order INT DEFAULT 0
      `);
            console.log('Column added successfully.');
        } else {
            console.log('Column display_order already exists.');
        }

        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
