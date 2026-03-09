import pool from './db';

const checkOrder = async () => {
    try {
        const [rows] = await pool.query('SELECT name, display_order FROM orchestras ORDER BY display_order ASC, name ASC');
        console.log('JSON_OUTPUT_START');
        console.log(JSON.stringify(rows, null, 2));
        console.log('JSON_OUTPUT_END');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkOrder();
