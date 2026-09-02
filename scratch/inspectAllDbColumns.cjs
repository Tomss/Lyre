const mysql = require('mysql2/promise');
require('dotenv').config();

async function inspectAllTables() {
  let connection;
  try {
    if (process.env.DATABASE_URL) {
      connection = await mysql.createConnection(process.env.DATABASE_URL);
    } else {
      connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306', 10),
        user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
        password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'lyre_db'
      });
    }

    console.log('=== COMPLETE DATABASE MEDIA COLUMN AUDIT ===\n');

    const [tables] = await connection.query(`SHOW TABLES`);
    const dbName = Object.keys(tables[0])[0];
    const tableNames = tables.map(t => t[dbName]);

    console.log(`Found ${tableNames.length} tables in DB:`, tableNames.join(', '));

    for (const tableName of tableNames) {
      const [cols] = await connection.query(`DESCRIBE \`${tableName}\``);
      const textCols = cols.filter(c => 
        c.Type.includes('varchar') || c.Type.includes('text') || c.Type.includes('char')
      ).map(c => c.Field);

      if (textCols.length === 0) continue;

      const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
      
      const primaryKey = cols.find(c => c.Key === 'PRI')?.Field || cols[0].Field;

      for (const col of textCols) {
        let externalCount = 0;
        let localJpgCount = 0;
        let localWebpCount = 0;
        let totalCount = 0;

        const samples = [];

        for (const row of rows) {
          const val = row[col];
          if (val && typeof val === 'string') {
            if (val.includes('/') || val.includes('http') || val.endsWith('.jpg') || val.endsWith('.png') || val.endsWith('.webp') || val.endsWith('.pdf') || val.endsWith('.avif')) {
              totalCount++;
              if (val.startsWith('http://') || val.startsWith('https://')) {
                externalCount++;
                if (samples.length < 3) samples.push(`[EXT] ${val}`);
              } else if (val.includes('.webp')) {
                localWebpCount++;
                if (samples.length < 3) samples.push(`[WEBP] ${val}`);
              } else {
                localJpgCount++;
                if (samples.length < 3) samples.push(`[OTHER] ${val}`);
              }
            }
          }
        }

        if (totalCount > 0) {
          console.log(`\n📌 Table \`${tableName}\` -> Column \`${col}\` (PK: ${primaryKey})`);
          console.log(`   Total items: ${totalCount} | External/Cloudinary: ${externalCount} | Local WebP: ${localWebpCount} | Local Other (JPG/PNG/PDF): ${localJpgCount}`);
          samples.forEach(s => console.log(`   -> ${s}`));
        }
      }
    }

  } catch (err) {
    console.error('Audit Error:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

inspectAllTables();
