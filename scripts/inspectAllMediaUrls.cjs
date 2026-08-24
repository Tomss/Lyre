const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runAudit() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const queries = [
    { table: 'carousel_images', col: 'image_url' },
    { table: 'page_headers', col: 'image_url' },
    { table: 'partners', col: 'logo_url' },
    { table: 'site_settings', col: 'setting_value' },
    { table: 'history_events', col: 'image_url' },
    { table: 'media_files', col: 'file_path' }
  ];

  console.log('=== VÉRIFICATION PHYSIQUE DES FICHIERS SUR DISQUE SSD ===');

  let totalChecked = 0;
  let totalFound = 0;
  const missing = [];

  for (const q of queries) {
    try {
      const [rows] = await conn.query('SELECT ' + q.col + ' as url FROM `' + q.table + '` WHERE `' + q.col + '` IS NOT NULL AND `' + q.col + '` != \'\'');
      for (const r of rows) {
        const url = r.url;
        if (url && (url.startsWith('/uploads/') || url.startsWith('uploads/'))) {
          totalChecked++;
          const filename = url.replace(/^\/?uploads\//, '');
          const inUploads = fs.existsSync(path.join('uploads', filename));
          const inPublic = fs.existsSync(path.join('public', filename));
          if (inUploads || inPublic) {
            totalFound++;
          } else {
            missing.push({ table: q.table, filename: filename });
          }
        }
      }
    } catch (err) {
      console.log('Erreur table ' + q.table + ':', err.message);
    }
  }

  console.log('Total vérifié :', totalChecked, 'fichiers');
  console.log('Total présents sur disque SSD (uploads/ ou public/) :', totalFound, 'fichiers');
  console.log('Fichiers manquants :', missing.length);
  if (missing.length > 0) {
    console.log('Détails des manquants :', missing);
  }

  await conn.end();
}

runAudit();

