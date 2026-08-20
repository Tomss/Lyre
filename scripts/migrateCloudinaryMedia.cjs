const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const mysql = require('mysql2/promise');
require('dotenv').config();

const UPLOADS_DIR = path.join(__dirname, '../uploads');
const MIGRATED_DIR = path.join(UPLOADS_DIR, 'migrated');
const SITE_DIR = path.join(UPLOADS_DIR, 'site');

// Ensure directories exist
if (!fs.existsSync(MIGRATED_DIR)) {
  fs.mkdirSync(MIGRATED_DIR, { recursive: true });
}
if (!fs.existsSync(SITE_DIR)) {
  fs.mkdirSync(SITE_DIR, { recursive: true });
}

// Download helper
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const request = client.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Handle redirect
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}, status code: ${response.statusCode}`));
      }
      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(destPath);
      });
      fileStream.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });

    request.on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });

    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error(`Timeout downloading ${url}`));
    });
  });
}

async function runMigration() {
  console.log('====================================================');
  console.log('🚀 DÉBUT DU RAPATRIEMENT COMPLET DES MÉDIAS (CLOUDINARY & EXTERNES)');
  console.log('====================================================');

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

    console.log('✓ Connecté à la base de données MySQL avec succès.');

    // 1. Download default logo to /uploads/site/logo_lyre.png
    const defaultCloudinaryLogo = 'https://res.cloudinary.com/dr2sbjrms/image/upload/v1774629447/lyre-uploads/ll5sutyvmfrocohfv3yd.png';
    const localLogoPath = path.join(SITE_DIR, 'logo_lyre.png');
    try {
      console.log('\n[1/3] Rapatriement du logo officiel de La Lyre...');
      await downloadFile(defaultCloudinaryLogo, localLogoPath);
      console.log('✓ Logo officiel rapatrié dans /uploads/site/logo_lyre.png');
    } catch (err) {
      console.warn('⚠️ Échec du téléchargement du logo par défaut:', err.message);
    }

    // 2. Scan DB tables for Cloudinary or External URLs (http/https)
    const targets = [
      { table: 'site_settings', primaryKey: 'setting_key', columns: ['setting_value'] },
      { table: 'page_headers', primaryKey: 'page_slug', columns: ['image_url'] },
      { table: 'carousel_images', primaryKey: 'id', columns: ['image_url'] },
      { table: 'history_events', primaryKey: 'id', columns: ['image_url'] },
      { table: 'media_files', primaryKey: 'id', columns: ['url'] },
      { table: 'events', primaryKey: 'id', columns: ['image_url'] },
      { table: 'partitions', primaryKey: 'id', columns: ['file_path'] },
      { table: 'profiles', primaryKey: 'id', columns: ['avatar_url'] },
      { table: 'orchestras', primaryKey: 'id', columns: ['photo_url'] },
      { table: 'news', primaryKey: 'id', columns: ['image_url'] },
      { table: 'partners', primaryKey: 'id', columns: ['logo_url'] },
      { table: 'instruments', primaryKey: 'id', columns: ['photo_url'] }
    ];

    let totalMigrated = 0;

    console.log('\n[2/3] Analyse approfondie des tables de la base de données...');

    for (const t of targets) {
      try {
        const [rows] = await connection.query(`SELECT * FROM \`${t.table}\``);
        for (const row of rows) {
          for (const col of t.columns) {
            const val = row[col];
            if (val && typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'))) {
              console.log(`\nFound External/Cloudinary URL in ${t.table}.${col} (ID: ${row[t.primaryKey]}):`);
              console.log(` -> ${val}`);

              try {
                // Extract filename & extension
                const urlParts = val.split('/');
                let originalFileName = urlParts[urlParts.length - 1].split('?')[0];
                let ext = path.extname(originalFileName) || '.jpg';
                if (ext.length > 5) ext = '.jpg';
                
                const baseName = path.basename(originalFileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
                const uniqueName = `migrated-${Date.now()}-${Math.round(Math.random() * 1000)}-${baseName}${ext}`;
                const localDest = path.join(MIGRATED_DIR, uniqueName);

                await downloadFile(val, localDest);
                const localUrl = `/uploads/migrated/${uniqueName}`;

                await connection.query(
                  `UPDATE \`${t.table}\` SET \`${col}\` = ? WHERE \`${t.primaryKey}\` = ?`,
                  [localUrl, row[t.primaryKey]]
                );

                console.log(`✓ Téléchargé & BDD mise à jour -> ${localUrl}`);
                totalMigrated++;
              } catch (dlErr) {
                console.error(`❌ Échec du rapatriement pour ${val}:`, dlErr.message);
              }
            }
          }
        }
      } catch (tableErr) {
        // Table might not exist or columns might vary, ignore silently
      }
    }

    console.log('\n====================================================');
    console.log(`🎉 MIGRATION COMPLÈTE TERMINÉE ! ${totalMigrated} fichier(s) rapatrié(s) sur le disque VPS.`);
    console.log('====================================================');

  } catch (err) {
    console.error('❌ Erreur générale de migration:', err);
  } finally {
    if (connection) await connection.end();
  }
}

runMigration();
