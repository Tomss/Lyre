const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  console.log('[WebP Auto-Migrator] Starting conversion of uploads to WebP...');
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) return;
  const files = fs.readdirSync(uploadsDir);
  const images = files.filter(f => /\.(jpe?g|png)$/i.test(f));
  console.log(`[WebP Auto-Migrator] Found ${images.length} images to convert.`);
  const replacements = [];
  for (const file of images) {
    const ext = path.extname(file);
    const base = path.basename(file, ext);
    const webpName = base + '.webp';
    const srcPath = path.join(uploadsDir, file);
    const destPath = path.join(uploadsDir, webpName);
    try {
      if (!fs.existsSync(destPath)) {
        await sharp(srcPath).resize({ width: 1920, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80, effort: 4 }).toFile(destPath);
        console.log(`[WebP Auto-Migrator] Converted ${file} -> ${webpName}`);
      }
      replacements.push({ oldFile: file, newFile: webpName });
    } catch (e) {
      console.error(`[WebP Auto-Migrator] Error converting ${file}:`, e.message);
    }
  }

  // Always ensure all bundled assets in public/ are present in uploads/ volume
  const publicDir = path.join(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    const publicFiles = fs.readdirSync(publicDir);
    for (const f of publicFiles) {
      if (f.endsWith('.webp') || f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')) {
        const src = path.join(publicDir, f);
        const dst = path.join(uploadsDir, f);
        try {
          if (!fs.existsSync(dst)) {
            fs.copyFileSync(src, dst);
          }
        } catch (e) {
          console.error(`[WebP Auto-Migrator] Error copying ${f}:`, e.message);
        }
      }
    }
    console.log('[WebP Auto-Migrator] All bundled assets synced to uploads volume.');
  }

  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      multipleStatements: true
    });

    // Check if database needs full Railway data import (history, headers, orchestras, etc.)
    try {
      const [historyRows] = await conn.query('SELECT COUNT(*) as count FROM history_events');
      if (historyRows[0].count < 15) {
        const dumpFile = path.join(process.cwd(), 'scripts', 'migrated_railway_dump.sql');
        if (fs.existsSync(dumpFile)) {
          console.log('[WebP Auto-Migrator] Importing full Railway dataset into MySQL...');
          const dumpSql = fs.readFileSync(dumpFile, 'utf8');
          await conn.query(dumpSql);
          console.log('[WebP Auto-Migrator] Full Railway dataset imported successfully.');
        }
      }
    } catch (e) {
      console.error('[WebP Auto-Migrator] Dump import check error:', e.message);
    }

    for (const { oldFile, newFile } of replacements) {
      try { await conn.query('UPDATE orchestras SET photo_url = REPLACE(photo_url, ?, ?) WHERE photo_url LIKE ?', [oldFile, newFile, '%' + oldFile + '%']); } catch(e) {}
      try { await conn.query('UPDATE orchestra_photos SET photo_url = REPLACE(photo_url, ?, ?) WHERE photo_url LIKE ?', [oldFile, newFile, '%' + oldFile + '%']); } catch(e) {}
      try { await conn.query('UPDATE news SET image_url = REPLACE(image_url, ?, ?) WHERE image_url LIKE ?', [oldFile, newFile, '%' + oldFile + '%']); } catch(e) {}
      try { await conn.query('UPDATE instruments SET photo_url = REPLACE(photo_url, ?, ?) WHERE photo_url LIKE ?', [oldFile, newFile, '%' + oldFile + '%']); } catch(e) {}
      try { await conn.query('UPDATE media_files SET file_path = REPLACE(file_path, ?, ?) WHERE file_path LIKE ?', [oldFile, newFile, '%' + oldFile + '%']); } catch(e) {}
    }

    console.log('[WebP Auto-Migrator] Database tables updated successfully.');
    await conn.end();
  } catch (err) {
    console.error('[WebP Auto-Migrator] DB error:', err.message);
  }
}

if (require.main === module) {
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { run };