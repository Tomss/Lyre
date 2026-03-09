import pool from './db';

const updatePageHeadersTable = async () => {
    const connection = await pool.getConnection();
    try {
        // Check if column exists
        const [columns] = await connection.query<any[]>(`
      SHOW COLUMNS FROM page_headers LIKE 'page_title'
    `);

        if (columns.length === 0) {
            console.log('Adding page_title column to page_headers table...');
            await connection.query(`
        ALTER TABLE page_headers
        ADD COLUMN page_title VARCHAR(255) DEFAULT NULL AFTER image_url
      `);
            console.log('Column page_title added successfully.');
        } else {
            console.log('Column page_title already exists.');
        }

    } catch (error) {
        console.error('Error updating page_headers table:', error);
    } finally {
        connection.release();
        process.exit();
    }
};

updatePageHeadersTable();
