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
  if (replacements.length === 0) return;
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306
    });
    for (const { oldFile, newFile } of replacements) {
      try { await conn.query('UPDATE orchestras SET photo_url = REPLACE(photo_url, ?, ?) WHERE photo_url LIKE ?', [oldFile, newFile, '%' + oldFile + '%']); } catch(e) {}
      try { await conn.query('UPDATE orchestra_photos SET photo_url = REPLACE(photo_url, ?, ?) WHERE photo_url LIKE ?', [oldFile, newFile, '%' + oldFile + '%']); } catch(e) {}
      try { await conn.query('UPDATE news SET image_url = REPLACE(image_url, ?, ?) WHERE image_url LIKE ?', [oldFile, newFile, '%' + oldFile + '%']); } catch(e) {}
      try { await conn.query('UPDATE instruments SET photo_url = REPLACE(photo_url, ?, ?) WHERE photo_url LIKE ?', [oldFile, newFile, '%' + oldFile + '%']); } catch(e) {}
      try { await conn.query('UPDATE media_files SET file_path = REPLACE(file_path, ?, ?) WHERE file_path LIKE ?', [oldFile, newFile, '%' + oldFile + '%']); } catch(e) {}
    // Ensure carousel images point to the 4 local WebP images
    try {
      const [existingCarousel] = await conn.query('SELECT * FROM carousel_images WHERE image_url LIKE "%carousel%"');
      if (existingCarousel.length < 4) {
        await conn.query('DELETE FROM carousel_images');
        const carouselPhotos = ['/uploads/carousel-1.webp', '/uploads/carousel-2.webp', '/uploads/carousel-3.webp', '/uploads/carousel-4.webp'];
        for (let i = 0; i < carouselPhotos.length; i++) {
          const id = require('crypto').randomUUID();
          await conn.query('INSERT INTO carousel_images (id, image_url, title, subtitle, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)', [
            id, carouselPhotos[i], '', '', i, 1
          ]);
        }
        console.log('[WebP Auto-Migrator] Restored 4 carousel WebP images.');
      }
    } catch (e) {
      console.error('[WebP Auto-Migrator] Carousel sync error:', e.message);
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