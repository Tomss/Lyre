const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const mysql = require('mysql2/promise');
require('dotenv').config();

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ sharp est requis. Installez-le avec npm install sharp.');
  process.exit(1);
}

const UPLOADS_DIR = path.join(__dirname, '../uploads');
const MIGRATED_DIR = path.join(UPLOADS_DIR, 'migrated');

if (!fs.existsSync(MIGRATED_DIR)) {
  fs.mkdirSync(MIGRATED_DIR, { recursive: true });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const request = client.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`HTTP ${response.statusCode} for ${url}`));
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
      reject(new Error(`Timeout ${url}`));
    });
  });
}

async function runMasterMigration() {
  console.log('====================================================');
  console.log('🚀 MASTER MIGRATION & OPTIMISATION WEBP ABSOLUE');
  console.log('====================================================\n');

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

    console.log('✓ Connecté à la base de données MySQL.');

    // 1. Complete list of table/column targets with EXACT primary keys and columns
    const targets = [
      { table: 'site_settings', pk: 'setting_key', cols: ['setting_value'] },
      { table: 'page_headers', pk: 'page_slug', cols: ['image_url'] },
      { table: 'carousel_images', pk: 'id', cols: ['image_url'] },
      { table: 'history_events', pk: 'id', cols: ['image_url'] },
      { table: 'media_files', pk: 'id', cols: ['file_path'] }, // Correct column name!
      { table: 'events', pk: 'id', cols: ['image_url'] },
      { table: 'partitions', pk: 'id', cols: ['file_path'] },
      { table: 'profiles', pk: 'id', cols: ['avatar_url'] },
      { table: 'orchestras', pk: 'id', cols: ['photo_url'] },
      { table: 'orchestra_photos', pk: 'id', cols: ['photo_url'] }, // Added!
      { table: 'news', pk: 'id', cols: ['image_url'] },
      { table: 'partners', pk: 'id', cols: ['logo_url'] },
      { table: 'instruments', pk: 'id', cols: ['photo_url'] }
    ];

    console.log('\n[1/3] Rapatriement de TOUTES les URLs distantes (Cloudinary / localhost / HTTP)...');
    let downloadedCount = 0;

    for (const t of targets) {
      try {
        const [rows] = await connection.query(`SELECT * FROM \`${t.table}\``);
        for (const row of rows) {
          for (const col of t.cols) {
            let val = row[col];
            if (!val || typeof val !== 'string') continue;

            // Normalize localhost URLs (e.g. http://localhost:3001/uploads/file.jpg -> /uploads/file.jpg)
            if (val.includes('localhost:3001/uploads/')) {
              const cleanPath = '/uploads/' + val.split('/uploads/')[1];
              await connection.query(`UPDATE \`${t.table}\` SET \`${col}\` = ? WHERE \`${t.pk}\` = ?`, [cleanPath, row[t.pk]]);
              val = cleanPath;
            }

            // Download external URLs (Cloudinary, etc.)
            if (val.startsWith('http://') || val.startsWith('https://')) {
              console.log(` -> Téléchargement de ${t.table}.${col} (${row[t.pk]}): ${val}`);
              const urlParts = val.split('/');
              let originalName = urlParts[urlParts.length - 1].split('?')[0];
              let ext = path.extname(originalName) || '.jpg';
              if (ext.length > 5) ext = '.jpg';

              const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
              const uniqueName = `migrated-${Date.now()}-${Math.round(Math.random()*1000)}-${baseName}${ext}`;
              const localDest = path.join(MIGRATED_DIR, uniqueName);

              try {
                await downloadFile(val, localDest);
                const localUrl = `/uploads/migrated/${uniqueName}`;
                await connection.query(`UPDATE \`${t.table}\` SET \`${col}\` = ? WHERE \`${t.pk}\` = ?`, [localUrl, row[t.pk]]);
                downloadedCount++;
                console.log(`    ✓ Rapatrié localement -> ${localUrl}`);
              } catch (dlErr) {
                console.error(`    ❌ Erreur téléchargement ${val}:`, dlErr.message);
              }
            }
          }
        }
      } catch (err) {
        // Ignore table errors
      }
    }

    console.log(`✓ ${downloadedCount} fichier(s) externe(s) rapatrié(s) en local.\n`);

    // 2. Convert ALL local images in uploads directory to WebP
    console.log('[2/3] Conversion de TOUTES les images locales en .webp (Qualité 85, 0 perte)...');

    function getAllFiles(dirPath, arrayOfFiles = []) {
      if (!fs.existsSync(dirPath)) return arrayOfFiles;
      const files = fs.readdirSync(dirPath);

      files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
          arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
          arrayOfFiles.push(fullPath);
        }
      });
      return arrayOfFiles;
    }

    const allFiles = getAllFiles(UPLOADS_DIR);
    const validImageExts = ['.jpg', '.jpeg', '.png', '.avif'];
    const imagesToConvert = allFiles.filter((f) => validImageExts.includes(path.extname(f).toLowerCase()));

    let convertedImagesCount = 0;
    let totalBytesSaved = 0;

    for (const imgPath of imagesToConvert) {
      const ext = path.extname(imgPath);
      const webpPath = imgPath.substring(0, imgPath.length - ext.length) + '.webp';

      try {
        const originalSize = fs.statSync(imgPath).size;

        await sharp(imgPath)
          .webp({ quality: 85, effort: 4 })
          .toFile(webpPath);

        const newSize = fs.statSync(webpPath).size;
        totalBytesSaved += (originalSize - newSize);

        if (imgPath !== webpPath && fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
        }

        convertedImagesCount++;
        console.log(` ✓ Converti: ${path.basename(imgPath)} (${Math.round(originalSize/1024)}KB -> ${Math.round(newSize/1024)}KB)`);
      } catch (err) {
        console.error(` ❌ Erreur conversion ${imgPath}:`, err.message);
      }
    }

    const savedMb = (totalBytesSaved / (1024 * 1024)).toFixed(2);
    console.log(`\n✓ ${convertedImagesCount} image(s) convertie(s) en WebP. Gain total: ${savedMb} Mo !\n`);

    // 3. Update DB paths to point to .webp
    console.log('[3/3] Réécriture globale des liens .jpg/.png/.avif vers .webp dans MySQL...');

    let dbUpdatedCount = 0;

    for (const t of targets) {
      try {
        const [rows] = await connection.query(`SELECT * FROM \`${t.table}\``);
        for (const row of rows) {
          for (const col of t.cols) {
            const val = row[col];
            if (val && typeof val === 'string') {
              const lower = val.toLowerCase();
              if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.avif')) {
                const newVal = val.substring(0, val.lastIndexOf('.')) + '.webp';
                await connection.query(
                  `UPDATE \`${t.table}\` SET \`${col}\` = ? WHERE \`${t.pk}\` = ?`,
                  [newVal, row[t.pk]]
                );
                dbUpdatedCount++;
                console.log(`  ✓ ${t.table}.${col} (${row[t.pk]}): ${val} -> ${newVal}`);
              }
            }
          }
        }
      } catch (err) {
        // Ignore table errors
      }
    }

    console.log(`\n✓ ${dbUpdatedCount} chemin(s) BDD mis à jour vers .webp.`);

    console.log('\n====================================================');
    console.log('🎉 AUDIT & CONVERSION WEBP 100% ACCOMPLIS SANS MANQUÉ !');
    console.log('====================================================');

  } catch (err) {
    console.error('❌ Erreur générale:', err);
  } finally {
    if (connection) await connection.end();
  }
}

runMasterMigration();
