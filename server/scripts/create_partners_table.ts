import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const createPartnersTable = async () => {
    const connection = await createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        await connection.query(`
      CREATE TABLE IF NOT EXISTS \`partners\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`logo_url\` text NOT NULL,
        \`description\` text,
        \`website_url\` text,
        \`display_order\` int DEFAULT '0',
        \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);
        console.log('Table `partners` created successfully.');
    } catch (error) {
        console.error('Error creating table:', error);
    } finally {
        await connection.end();
    }
};

createPartnersTable();
