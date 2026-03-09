import pool from './db';

const createPageHeadersTable = async () => {
    const connection = await pool.getConnection();
    try {
        await connection.query(`
      CREATE TABLE IF NOT EXISTS page_headers (
        page_slug VARCHAR(50) PRIMARY KEY,
        image_url TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        console.log('Table page_headers created successfully');

        // Insert default values if not exists (optional, but good for testing)
        const defaults = [
            { slug: 'school', url: 'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop' },
            { slug: 'events', url: 'https://images.pexels.com/photos/167491/pexels-photo-167491.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop' },
            { slug: 'media', url: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop' },
            { slug: 'contact', url: 'https://images.pexels.com/photos/2097616/pexels-photo-2097616.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop' }
        ];

        for (const def of defaults) {
            await connection.query(`
        INSERT IGNORE INTO page_headers (page_slug, image_url) VALUES (?, ?)
      `, [def.slug, def.url]);
        }
        console.log('Default headers inserted');

    } catch (error) {
        console.error('Error creating page_headers table:', error);
    } finally {
        connection.release();
        process.exit();
    }
};

createPageHeadersTable();
