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

  // Always ensure bundled assets in public/ are present in uploads/
  const publicDir = path.join(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    for (const f of ['carousel-1.webp', 'carousel-2.webp', 'carousel-3.webp', 'carousel-4.webp', 'hero-banner.webp']) {
      const src = path.join(publicDir, f);
      const dst = path.join(uploadsDir, f);
      try {
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dst);
          console.log(`[WebP Auto-Migrator] Copied ${f} to uploads.`);
        }
      } catch (e) {
        console.error(`[WebP Auto-Migrator] Error copying ${f}:`, e.message);
      }
    }
  }

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
    }

    // Unconditionally ensure carousel images point to the 4 local WebP images from Railway
    try {
      await conn.query('DELETE FROM carousel_images');
      const carouselPhotos = [
        { id: '9bf2f528-6b7e-4e5d-835f-cb411f13eee1', url: '/uploads/carousel-1.webp', order: 0 },
        { id: 'c524be45-5a8e-43c5-b1d8-5cd1d3141583', url: '/uploads/carousel-2.webp', order: 1 },
        { id: '2a459382-8508-4f73-9139-efd1bce9e6dd', url: '/uploads/carousel-3.webp', order: 2 },
        { id: '899e026c-fa1d-4c93-809b-90a5cd85530f', url: '/uploads/carousel-4.webp', order: 3 }
      ];
      for (const item of carouselPhotos) {
        await conn.query('INSERT INTO carousel_images (id, image_url, title, subtitle, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)', [
          item.id, item.url, '', '', item.order, 1
        ]);
      }
      console.log('[WebP Auto-Migrator] Restored 4 carousel WebP images in database.');
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