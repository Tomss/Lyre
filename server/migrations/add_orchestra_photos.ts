import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const db = createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ecole_musique',
});

async function migrate() {
    try {
        const connection = await db.getConnection();
        console.log('Connected to database.');

        // Create orchestra_photos table
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS orchestra_photos (
        id VARCHAR(36) PRIMARY KEY,
        orchestra_id VARCHAR(36) NOT NULL,
        photo_url TEXT NOT NULL,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (orchestra_id) REFERENCES orchestras(id) ON DELETE CASCADE
      )
    `;

        await connection.query(createTableQuery);
        console.log('orchestra_photos table created or already exists.');

        // Check if we need to migrate existing photos
        // This is a one-time migration to move existing photos from orchestras table to orchestra_photos
        // We only do this if orchestra_photos is empty
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM orchestra_photos');
        const count = (rows as any)[0].count;

        if (count === 0) {
            console.log('Migrating existing photos...');
            const [orchestras] = await connection.query('SELECT id, photo_url FROM orchestras WHERE photo_url IS NOT NULL');

            for (const orch of (orchestras as any[])) {
                if (orch.photo_url) {
                    const photoId = crypto.randomUUID();
                    await connection.query(
                        'INSERT INTO orchestra_photos (id, orchestra_id, photo_url, display_order) VALUES (?, ?, ?, ?)',
                        [photoId, orch.id, orch.photo_url, 0]
                    );
                }
            }
            console.log('Existing photos migrated.');
        }

        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
