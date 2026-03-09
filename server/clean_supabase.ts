import pool from './db';

const TABLES_TO_CHECK = [
    { table: 'instruments', column: 'photo_url' },
    { table: 'events', column: 'image_url' },
    { table: 'orchestras', column: 'photo_url' },
    { table: 'partners', column: 'logo_url' },
    { table: 'media', column: 'file_path' }
];

async function cleanSupabaseLinks() {
    console.log('--- STARTING SUPABASE LINK CLEANUP ---');
    let totalRemoved = 0;

    try {
        // 1. Check Standard Tables
        for (const { table, column } of TABLES_TO_CHECK) {
            try {
                const [rows]: any = await pool.query(
                    `SELECT id FROM ${table} WHERE ${column} LIKE '%supabase%' OR ${column} LIKE '%iptlsrswle%'`
                );

                if (rows.length > 0) {
                    console.log(`Found ${rows.length} items in ${table}.${column}`);

                    const [result]: any = await pool.query(
                        `UPDATE ${table} SET ${column} = NULL WHERE ${column} LIKE '%supabase%' OR ${column} LIKE '%iptlsrswle%'`
                    );
                    console.log(`Updated ${table}: ${result.affectedRows} rows set to NULL.`);
                    totalRemoved += result.affectedRows;
                } else {
                    console.log(`No Supabase links in ${table}.${column}`);
                }
            } catch (err: any) {
                console.log(`Note: Check for ${table} skipped (might not exist). Error: ${err.message}`);
            }
        }

        // 2. Orchestra Photos Table (Delete rows instead of NULL)
        try {
            const table = 'orchestra_photos';
            const column = 'photo_url';
            const [rows]: any = await pool.query(
                `SELECT id FROM ${table} WHERE ${column} LIKE '%supabase%' OR ${column} LIKE '%iptlsrswle%'`
            );

            if (rows.length > 0) {
                console.log(`Found ${rows.length} items in ${table}.${column}`);
                const [result]: any = await pool.query(
                    `DELETE FROM ${table} WHERE ${column} LIKE '%supabase%' OR ${column} LIKE '%iptlsrswle%'`
                );
                console.log(`Deleted ${result.affectedRows} rows from ${table}.`);
                totalRemoved += result.affectedRows;
            } else {
                console.log(`No Supabase links in ${table}`);
            }
        } catch (err: any) {
            // Ignore
        }

        console.log('--- CLEANUP COMPLETE ---');
        console.log(`Total legacy links removed: ${totalRemoved}`);
        process.exit(0);

    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
}

cleanSupabaseLinks();
