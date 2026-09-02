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
    const query = `
      SELECT 
        e.id, e.title, e.description, e.event_type, 
        DATE_FORMAT(e.event_date, '%Y-%m-%dT%H:%i:%s') as event_date,
        TIME_FORMAT(e.end_time, '%H:%i') as end_time,
        e.location,
        COALESCE(
          e.image_url,
          (
            SELECT COALESCE(o2.photo_url, (SELECT op.photo_url FROM orchestra_photos op WHERE op.orchestra_id = o2.id ORDER BY op.display_order ASC LIMIT 1))
            FROM event_orchestras eo2
            JOIN orchestras o2 ON eo2.orchestra_id = o2.id
            WHERE eo2.event_id = e.id
            ORDER BY o2.display_order ASC, o2.name ASC
            LIMIT 1
          )
        ) AS image_url,
        CASE 
          WHEN COUNT(o.id) > 0 THEN 
            JSON_ARRAYAGG(
              JSON_OBJECT('id', o.id, 'name', o.name)
            )
          ELSE 
            JSON_ARRAY()
        END AS orchestras
      FROM events e
      LEFT JOIN event_orchestras eo ON e.id = eo.event_id
      LEFT JOIN orchestras o ON eo.orchestra_id = o.id
      WHERE e.is_public = 1
      GROUP BY e.id
      ORDER BY e.event_date DESC;
    `;

    const [events] = await pool.query(query);
    console.log('Public events count:', events.length);
    console.log('Sample public event with image_url:', events[0]);
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

test();
