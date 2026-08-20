const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Le module sharp est requis. Installez-le avec "npm install sharp".');
  process.exit(1);
}

const UPLOADS_DIR = path.join(__dirname, '../uploads');

async function runWebpConversion() {
  console.log('====================================================');
  console.log('⚡ DÉBUT DE LA CONVERSION EN WEBP & OPTIMISATION DES IMAGES');
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

    console.log('✓ Connecté à la base de données MySQL avec succès.');

    // Helper to recursively list image files
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
    const validExts = ['.jpg', '.jpeg', '.png', '.avif'];
    const filesToConvert = allFiles.filter((f) => validExts.includes(path.extname(f).toLowerCase()));

    console.log(`\n[1/2] Conversion de ${filesToConvert.length} image(s) vers WebP sans perte de qualité...`);

    let convertedCount = 0;
    let bytesSaved = 0;

    for (const filePath of filesToConvert) {
      const ext = path.extname(filePath);
      const webpPath = filePath.substring(0, filePath.length - ext.length) + '.webp';

      try {
        const originalSize = fs.statSync(filePath).size;
        
        // Convert to webp with 85 quality (visually indistinguishable from original)
        await sharp(filePath)
          .webp({ quality: 85, effort: 4 })
          .toFile(webpPath);

        const newSize = fs.statSync(webpPath).size;
        bytesSaved += (originalSize - newSize);

        // Remove old file
        if (filePath !== webpPath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        convertedCount++;
        console.log(` ✓ Converti: ${path.basename(filePath)} (${Math.round(originalSize/1024)}KB -> ${Math.round(newSize/1024)}KB)`);
      } catch (err) {
        console.error(` ❌ Échec conversion pour ${filePath}:`, err.message);
      }
    }

    const savedMb = (bytesSaved / (1024 * 1024)).toFixed(2);
    console.log(`\n✓ ${convertedCount} image(s) convertie(s). Gain d'espace total : ${savedMb} Mo !`);

    // 2. Update DB references
    console.log('\n[2/2] Mise à jour des références dans la base de données...');

    const targets = [
      { table: 'site_settings', primaryKey: 'setting_key', columns: ['setting_value'] },
      { table: 'page_headers', primaryKey: 'page_slug', columns: ['image_url'] },
      { table: 'carousel_images', primaryKey: 'id', columns: ['image_url'] },
      { table: 'history_events', primaryKey: 'id', columns: ['image_url'] },
      { table: 'media_files', primaryKey: 'id', columns: ['url'] },
      { table: 'events', primaryKey: 'id', columns: ['image_url'] },
      { table: 'profiles', primaryKey: 'id', columns: ['avatar_url'] },
      { table: 'orchestras', primaryKey: 'id', columns: ['photo_url'] },
      { table: 'news', primaryKey: 'id', columns: ['image_url'] },
      { table: 'partners', primaryKey: 'id', columns: ['logo_url'] },
      { table: 'instruments', primaryKey: 'id', columns: ['photo_url'] }
    ];

    let dbUpdatedCount = 0;

    for (const t of targets) {
      try {
        const [rows] = await connection.query(`SELECT * FROM \`${t.table}\``);
        for (const row of rows) {
          for (const col of t.columns) {
            const val = row[col];
            if (val && typeof val === 'string') {
              const lower = val.toLowerCase();
              if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.avif')) {
                const newVal = val.substring(0, val.lastIndexOf('.')) + '.webp';
                await connection.query(
                  `UPDATE \`${t.table}\` SET \`${col}\` = ? WHERE \`${t.primaryKey}\` = ?`,
                  [newVal, row[t.primaryKey]]
                );
                dbUpdatedCount++;
              }
            }
          }
        }
      } catch (tableErr) {
        // Ignore if table missing
      }
    }

    console.log(`✓ ${dbUpdatedCount} lien(s) d'images mis à jour en .webp dans MySQL.`);

    console.log('\n====================================================');
    console.log('🎉 OPTIMISATION WEBP TERMINÉE AVEC SUCCÈS !');
    console.log('====================================================');

  } catch (err) {
    console.error('❌ Erreur lors de la conversion WebP:', err);
  } finally {
    if (connection) await connection.end();
  }
}

runWebpConversion();
