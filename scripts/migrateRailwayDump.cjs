const fs = require('fs');
const https = require('https');
const path = require('path');
const sharp = require('sharp');
const mysql = require('mysql2/promise');
require('dotenv').config();

const dumpPath = path.join('C:', 'Users', 'Admin', '.gemini', 'antigravity', 'brain', 'e021fbca-cc31-4258-93f4-416cc0ae78e6', 'scratch', 'live_railway_dump.sql');
const sql = fs.readFileSync(dumpPath, 'utf8');

async function downloadAndConvertToWebp(url, destFilename) {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const destPath = path.join(uploadsDir, destFilename);
  if (fs.existsSync(destPath)) return '/uploads/' + destFilename;
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
              console.log('Processed redirect:', destFilename);
            } catch(e) { console.error('Sharp error redirect', destFilename, e.message); }
            resolve('/uploads/' + destFilename);
          });
        });
      }
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', async () => {
        try {
          const buf = Buffer.concat(chunks);
          await sharp(buf).resize({ width: 1920, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toFile(destPath);
          console.log('Processed:', destFilename);
        } catch(e) { console.error('Sharp error', destFilename, e.message); }
        resolve('/uploads/' + destFilename);
      });
    }).on('error', (e) => {
      console.error('Download error for', destFilename, e.message);
      resolve('/uploads/' + destFilename);
    });
  });
}

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });
  console.log('Parsing Railway dump...');
  const urlMatches = sql.match(/https:\/\/res\.cloudinary\.com\/[^\s\'\",)]+/g) || [];
  const uniqueUrls = [...new Set(urlMatches)];
  console.log('Found unique Cloudinary URLs:', uniqueUrls.length);
  const urlMap = new Map();
  for (let i = 0; i < uniqueUrls.length; i++) {
    const url = uniqueUrls[i];
    const urlParts = url.split('/');
    const rawFileName = urlParts[urlParts.length - 1];
    const baseName = rawFileName.replace(/\.[^/.]+$/, '');
    const webpName = 'railway_' + baseName + '.webp';
    console.log('[' + (i+1) + '/' + uniqueUrls.length + '] Processing ' + baseName + '...');
    const localPath = await downloadAndConvertToWebp(url, webpName);
    urlMap.set(url, localPath);
  }
  let convertedSql = sql;
  for (const [cloudUrl, localUrl] of urlMap.entries()) {
    convertedSql = convertedSql.split(cloudUrl).join(localUrl);
  }
  fs.writeFileSync('scripts/migrated_railway_dump.sql', convertedSql);
  console.log('Saved scripts/migrated_railway_dump.sql');
  console.log('Importing into MySQL database...');
  await conn.query(convertedSql);
  console.log('SUCCESSFULLY IMPORTED FULL RAILWAY DATA IN WEBP FORMAT INTO MYSQL!');
  await conn.end();
}

run().catch(e => console.error('Migration error:', e));