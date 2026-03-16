import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';
import { RowDataPacket } from 'mysql2';

const router = Router();

// GET /api/settings (Public) - Retrieve all settings
router.get('/', async (req, res) => {
    try {
        const query = 'SELECT * FROM site_settings';
        const [rows] = await pool.query<RowDataPacket[]>(query);

        // Transform into a key-value object
        const settings: Record<string, string> = {};
        rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });

        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Error fetching settings.' });
    }
});

// POST /api/settings (Admin) - Update settings (Batch update)
router.post('/', authenticateToken, async (req, res) => {
    // @ts-ignore
    if ((req as any).user.role !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('theme'))) {
        return res.status(403).json({ message: 'Access denied.' });
    }

    const settings = req.body; // Expect an object { key: value, key2: value2 }
    console.log('Received settings payload:', settings);

    try {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            for (const [key, value] of Object.entries(settings)) {
                console.log(`Upserting ${key} = ${value}`);
                await connection.query(
                    'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                    [key, value, value]
                );
            }

            await connection.commit();
            res.json({ message: 'Settings updated successfully.' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ message: 'Error updating settings.' });
    }
});

// GET /api/settings/headers (Public) - Retrieve all page headers
router.get('/headers', async (req, res) => {
    try {
        const query = 'SELECT * FROM page_headers';
        const [rows] = await pool.query<RowDataPacket[]>(query);

        const headers: Record<string, string> = {};
        rows.forEach((row: any) => {
            headers[row.page_slug] = row.image_url;
        });

        res.json(headers);
    } catch (error) {
        console.error('Error fetching page headers:', error);
        res.status(500).json({ message: 'Error fetching page headers.' });
    }
});

// POST /api/settings/headers (Admin) - Update page headers
router.post('/headers', authenticateToken, async (req, res) => {
    // @ts-ignore
    if ((req as any).user.role !== 'Admin' && (!(req as any).user.managedModules || !(req as any).user.managedModules.includes('theme'))) {
        return res.status(403).json({ message: 'Access denied.' });
    }

    const { slug, imageUrl } = req.body;

    if (!slug || !imageUrl) {
        return res.status(400).json({ message: 'Slug and imageUrl are required.' });
    }

    try {
        const connection = await pool.getConnection();
        try {
            await connection.query(
                `INSERT INTO page_headers (page_slug, image_url) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE image_url = VALUES(image_url)`,
                [slug, imageUrl]
            );
            res.json({ message: 'Header updated successfully.' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error updating page headers:', error);
        res.status(500).json({ message: 'Error updating page headers.' });
    }
});

export default router;
