const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  });

  try {
    console.log('Testing DB connection...');
    console.log('Host:', process.env.DB_HOST);
    console.log('Database:', process.env.DB_NAME);

    const [cols] = await pool.query('DESCRIBE events');
    console.log('Columns in events:', cols.map(c => `${c.Field} (${c.Type})`));

    const [events] = await pool.query(`
      SELECT 
        e.id, e.title, e.description, e.event_type, 
        DATE_FORMAT(e.event_date, '%Y-%m-%dT%H:%i:%s') as event_date,
        TIME_FORMAT(e.end_time, '%H:%i') as end_time,
        e.location, e.is_public, e.practical_info,
        JSON_ARRAYAGG(JSON_OBJECT('id', o.id, 'name', o.name)) AS orchestras
      FROM events e
      LEFT JOIN event_orchestras eo ON e.id = eo.event_id
      LEFT JOIN orchestras o ON eo.orchestra_id = o.id
      GROUP BY e.id
      ORDER BY e.event_date DESC
    `);
    console.log('Query success! Number of events fetched:', events.length);
    console.log('Sample event:', JSON.stringify(events[0], null, 2));

  } catch (error) {
    console.error('Query error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

test();
