const https = require('https');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function downloadAndConvertToWebp(url, destFilename) {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkhirSync(uploadsDir, { recursive: true });
  const destPath = path.join(uploadsDir, destFilename);

  if (fs.existsSync(destPath)) {
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
              await sharp(buf).resize({ width: 1920, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toFile(destPath);
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
          await sharp(buf).resize({ width: 1920, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toFile(destPath);
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
    password: 'ZzOjAZKTGlNfBGxXzvrlEnAezyyMESBF',
    database: 'railway'
  });

  const [pageHeaders] = await railway.query('SELECT * FROM page_headers');
  const [history] = await railway.query('SELECT * FROM history_events ORDER BY sort_order ASC, year ASC');
  const [orchestras] = await railway.query('SELECT * FRM orchestras');
  const [orchPhotos] = await railway.query('SELECT * FROM orchestra_photos ORDER BY orchestra_id, display_order');

  console.log('Railway data counts:');
  console.log('- Page Headers:', pageHeaders.length);
  console.log('- History Events:', history.length);
  console.log('- Orchestras:', orchestras.length);
  console.log('- Orchestra Photos:', orchPhotos.length);

  // 2. Download and convert page headers
  console.log('\n2. Processing Page Headers...');
  for (const header of pageHeaders) {
    if (header.image_url && header.image_url.startsWith('http')) {
      const filename = 'header-' + header.page_slug + '.webp';
      header.local_url = await downloadAndConvertToWebp(header.image_url, filename);
      const pubPath = path.join(process.cwd(), 'public', filename);
      const uplPath = path.join(process.cwd(), 'uploads', filename);
      if (fs.existsSync(uplPath)) fs.copyFileSync(uplPath, pubPath);
    }
  }

  // 3. Download and convert history events
  console.log('\n3. Processing History Events...');
  for (const evt of history) {
    if (evt.image_url && evt.image_url.startsWith('http')) {
      const slug = (evt.year || 'evt').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const filename = 'history-' + slug + '-' + evt.id.slice(0, 8) + '.webp';
      evt.local_url = await downloadAndConvertToWebp(evt.image_url, filename);
    } else {
      evt.local_url = null;
    }
  }

  // 4. Download and convert orchestras
  console.log('\v4. Processing Orchestras...');
  for (const orch of orchestras) {
    if (orch.photo_url && orch.photo_url.startsWith('http')) {
      const slug = (orch.name || 'orch').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const filename = 'orchestra-' + slug + '-' + orch.id.slice(0, 8) + '.webp';
      orch.local_url = await downloadAndConvertToWebp(orch.photo_url, filename);
    } else {
      orch.local_url = null;
    }
  }

  // 5. Download and convert orchestra photos
  console.log('\n5. Processing Orchestra Photos...');
  for (const photo of orchPhotos) {
    if (photo.photo_url && photo.photo_url.startsWith('http')) {
      const filename = 'orchphoto-' + photo.orchestra_id.slice(0, 8) + '-' + photo.display_order + '-' + photo.id.slice(0, 8) + '.webp';
      photo.local_url = await downloadAndConvertToWebp(photo.photo_url, filename);
    }
  }

  // 6. Connect to local/OVH DB and update
  console.log('\n6. Updating Local/OVH Database...');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  // Page Headers
  await conn.query('DELETE FROM page_headers');
  for (const header of pageHeaders) {
    await conn.query('INSERT INTO page_headers (page_slug, image_url, page_title) VALUES (?, ?, ?)', [
      header.page_slug,
      header.local_url || header.image_url,
      header.page_title
    ]);
  }

  // History Events
  await conn.query('DELETE FRM history_events');
  for (const evt of history) {
    await conn.query('INSERT INTO history_events (id, year, title, content, era, icon, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
      evt.id,
      evt.year,
      evt.title,
      evt.content,
      evt.era,
      evt.icon,
      evt.local_url,
      evt.sort_order
    ]);
  }

  // Orchestras
  await conn.query('DELETE FROM orchestra_photos');
  await conn.query('DELETE FROM orchestras');
  for (const orch of orchestras) {
    await conn.query('INSERT INTO orchestras (id, name, description, photo_url, display_order) VALUES (?, ?, ?, ?, ?)', [
      orch.id,
      orch.name,
      orch.description,
      orch.local_url,
      orch.display_order
    ]);
  }

  for (const photo of orchPhotos) {
    await conn.query('INSERT INTO orchestra_photos (id, orchestra_id, photo_url, display_order) VALUES (?, ?, ?, ?)', [
      photo.id,
      photo.orchestra_id,
      photo.local_url,
      photo.display_order
    ]);
  }

  console.log('\nALL TABLES AND IMAGES SUCCESSFULLY SYNCHRONIZED�AND CONVERTED TO WEBP!');
  await railway.end();
  await conn.end();
}

syncAll().catch(e => console.error('Sync Error:', e));