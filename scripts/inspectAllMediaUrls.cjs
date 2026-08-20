const mysql = require('mysql2/promise');
require('dotenv').config();

async function inspectAllMedia() {
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

    console.log('====================================================');
    console.log('🔍 AUDIT DÉTAILLÉ DE TOUS LES LIENS MÉDIAS EN BDD');
    console.log('====================================================\n');

    const targets = [
      { table: 'site_settings', key: 'setting_key', cols: ['setting_value'] },
      { table: 'page_headers', key: 'page_slug', cols: ['image_url'] },
      { table: 'carousel_images', key: 'title', cols: ['image_url'] },
      { table: 'history_events', key: 'title', cols: ['image_url'] },
      { table: 'media_files', key: 'file_name', cols: ['url'] },
      { table: 'events', key: 'title', cols: ['image_url'] },
      { table: 'partitions', key: 'nom', cols: ['file_path'] },
      { table: 'profiles', key: 'first_name', cols: ['avatar_url'] },
      { table: 'orchestras', key: 'name', cols: ['photo_url'] },
      { table: 'news', key: 'title', cols: ['image_url'] },
      { table: 'partners', key: 'name', cols: ['logo_url'] },
      { table: 'instruments', key: 'name', cols: ['photo_url'] }
    ];

    const stats = {
      localUploads: 0,
      cloudinary: 0,
      pexels: 0,
      otherExternal: 0,
      emptyOrNull: 0
    };

    for (const t of targets) {
      try {
        const [rows] = await connection.query(`SELECT * FROM \`${t.table}\``);
        console.log(`📌 TABLE: ${t.table} (${rows.length} entrées)`);
        
        if (rows.length === 0) {
          console.log(`   (Aucune donnée)`);
          continue;
        }

        for (const row of rows) {
          for (const col of t.cols) {
            const val = row[col];
            if (!val) {
              stats.emptyOrNull++;
            } else if (val.startsWith('/uploads/') || val.startsWith('uploads/')) {
              stats.localUploads++;
              console.log(`   [LOCAL VPS] ${row[t.key] || 'ID'}: ${val}`);
            } else if (val.includes('cloudinary.com')) {
              stats.cloudinary++;
              console.log(`   [CLOUDINARY] ${row[t.key] || 'ID'}: ${val}`);
            } else if (val.includes('pexels.com')) {
              stats.pexels++;
              console.log(`   [PEXELS] ${row[t.key] || 'ID'}: ${val}`);
            } else {
              stats.otherExternal++;
              console.log(`   [AUTRE EXTERNE] ${row[t.key] || 'ID'}: ${val}`);
            }
          }
        }
        console.log('');
      } catch (err) {
        console.log(`⚠️ Table ${t.table} inaccessible: ${err.message}\n`);
      }
    }

    console.log('====================================================');
    console.log('📊 RÉSUMÉ GLOBAL DE L\'AUDIT :');
    console.log(` - 🟢 Liens Locaux VPS (/uploads/...) : ${stats.localUploads}`);
    console.log(` - ☁️ Liens Cloudinary (Cloudinary)   : ${stats.cloudinary}`);
    console.log(` - 🖼️ Liens Stock Photo (Pexels)     : ${stats.pexels}`);
    console.log(` - 🌐 Liens Autres Externes           : ${stats.otherExternal}`);
    console.log('====================================================');

  } catch (err) {
    console.error('❌ Erreur de connexion MySQL:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

inspectAllMedia();
