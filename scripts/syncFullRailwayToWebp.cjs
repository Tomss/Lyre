const https = require('https');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function downloadAndConvertToWebp(url, destFilename) {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const destPath = path.join(uploadsDir, destFilename);
  const pubPath = path.join(publicDir, destFilename);

  if (fs.existsSync(destPath)) {
    if (!fs.existsSync(pubPath)) fs.copyFileSync(destPath, pubPath);
    return '/uploads/' + destFilename;
  }

  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return https.get(res.headers.location, (redRes) => {
          const chunks = [];
          redRes.on('data', d => chunks.push(d));
          redRes.on('end', async () => {
            try {
              const buf = Buffer.concat(chunks);
              await sharp(buf).resize({ width: 1600, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80, effort: 4 }).toFile(destPath);
              fs.copyFileSync(destPath, pubPath);
              console.log('Processed (redirect):', destFilename);
            } catch(e) {
              console.error('Sharp error (redirect)', destFilename, e.message);
            }
            resolve('/uploads/' + destFilename);
          });
        });
      }

      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', async () => {
        try {
          const buf = Buffer.concat(chunks);
          await sharp(buf).resize({ width: 1600, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80, effort: 4 }).toFile(destPath);
          fs.copyFileSync(destPath, pubPath);
          console.log('Processed:', destFilename);
        } catch(e) {
          console.error('Sharp error', destFilename, e.message);
        }
        resolve('/uploads/' + destFilename);
      });
    }).on('error', (e) => {
      console.error('Download error for', destFilename, e.message);
      resolve('/uploads/' + destFilename);
    });
  });
}

async function syncAll() {
  console.log('1. Connecting to Railway...');
  const railway = await mysql.createConnection({
    host: 'shortline.proxy.rlwy.net',
    port: 53715,
    user: 'root',
    password: 'ZzOjAZKTGlNfBGxXzvrlEnAezyyMESBf',
    database: 'railway'
  });

  const [mediaList] = await railway.query('SELECT * FROM media_items');
  const [mediaFiles] = await railway.query('SELECT * FROM media_files');

  console.log('Railway data counts:');
  console.log('- Media items:', mediaList.length);
  console.log('- Media files:', mediaFiles.length);
  console.log('Sample file:', mediaFiles[0]);

  // 2. Download and convert media files
  console.log('\n2. Processing Media Files (Albums, Photos)...');
  for (let i = 0; i < mediaFiles.length; i++) {
    const file = mediaFiles[i];
    if (file.file_path && file.file_type === 'image' && file.file_path.startsWith('http')) {
      const urlParts = file.file_path.split('/');
      const rawName = urlParts[urlParts.length - 1].replace(/\.[^/.]+$/, '');
      const filename = 'media_' + rawName + '.webp';
      file.local_url = await downloadAndConvertToWebp(file.file_path, filename);
      console.log(`[${i+1}/${mediaFiles.length}] Converted ${filename}`);
    } else {
      file.local_url = file.file_path;
    }
  }

  // 3. Connect to local/OVH DB and update
  console.log('\n3. Updating Local/OVH Database for Media & Media_Files...');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  await conn.query('DELETE FROM media_files');
  await conn.query('DELETE FROM media_items');

  for (const m of mediaList) {
    await conn.query('INSERT INTO media_items (id, title, description, media_type, created_by, created_at, updated_at, is_featured, published, media_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
      m.id,
      m.title,
      m.description,
      m.media_type,
      m.created_by || '29cbd663-433a-45a7-9d30-85e4e4d8dd60',
      m.created_at || new Date(),
      m.updated_at || new Date(),
      m.is_featured || m.is_highlight || 0,
      m.published !== undefined ? m.published : (m.is_published !== undefined ? m.is_published : 1),
      m.media_date || m.event_date || null
    ]);
  }

  for (const mf of mediaFiles) {
    await conn.query('INSERT INTO media_files (id, media_item_id, file_name, file_path, file_type, file_size, mime_type, alt_text, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
      mf.id,
      mf.media_item_id || mf.media_id,
      mf.file_name,
      mf.local_url || mf.file_path,
      mf.file_type,
      mf.file_size || null,
      mf.mime_type || null,
      mf.alt_text || null,
      mf.sort_order || 0,
      mf.created_at || new Date()
    ]);
  }

  console.log('\nALL MEDIA AND ALBUMS SUCCESSFULLY SYNCHRONIZED AND CONVERTED TO WEBP!');
  await railway.end();
  await conn.end();
}

syncAll().catch(e => console.error('Sync Error:', e));