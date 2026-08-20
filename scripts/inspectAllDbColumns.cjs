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

    let grandTotalLocalWebp = 0;
    let grandTotalExternal = 0;
    let grandTotalOtherLocal = 0;

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
        let localWebpCount = 0;
        let localOtherCount = 0;
        let totalCount = 0;

        const samples = [];

        for (const row of rows) {
          const val = row[col];
          if (val && typeof val === 'string') {
            const lower = val.toLowerCase();
            if (lower.startsWith('/uploads/') || lower.startsWith('uploads/') || lower.startsWith('http://') || lower.startsWith('https://') || lower.endsWith('.webp') || lower.endsWith('.jpg') || lower.endsWith('.png') || lower.endsWith('.pdf') || lower.endsWith('.avif')) {
              if (tableName === 'users' && col === 'password_hash') continue;
              if (tableName === 'history_events' && col === 'content') continue;
              if (col === 'website_url') continue;

              totalCount++;
              if (lower.startsWith('http://') || lower.startsWith('https://')) {
                externalCount++;
                grandTotalExternal++;
                if (samples.length < 3) samples.push(`[EXTERN] ${val}`);
              } else if (lower.endsWith('.webp')) {
                localWebpCount++;
                grandTotalLocalWebp++;
                if (samples.length < 3) samples.push(`[WEBP] ${val}`);
              } else {
                localOtherCount++;
                grandTotalOtherLocal++;
                if (samples.length < 3) samples.push(`[LOCAL OTHER] ${val}`);
              }
            }
          }
        }

        if (totalCount > 0) {
          console.log(`📌 Table \`${tableName}\` -> Column \`${col}\` (${totalCount} éléments)`);
          console.log(`   └─ 🟢 WebP VPS : ${localWebpCount} | 🌐 Externes : ${externalCount} | 📄 PDF/Autres : ${localOtherCount}`);
          samples.forEach(s => console.log(`      -> ${s}`));
          console.log('');
        }
      }
    }

    console.log('====================================================');
    console.log(`📊 TOTAL GLOBAL BASE DE DONNÉES :`);
    console.log(`   🟢 Images WebP VPS locales : ${grandTotalLocalWebp}`);
    console.log(`   📄 Partitions PDF locales : ${grandTotalOtherLocal}`);
    console.log(`   🌐 URLs Distantes externes : ${grandTotalExternal}`);
    console.log('====================================================');

  } catch (err) {
    console.error('Audit Error:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

inspectAllTables();
