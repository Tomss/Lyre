import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import pool from './db';

// Routers
import authRouter from './routes/auth';
import eventsRouter from './routes/events';
import publicEventsRouter from './routes/publicEvents';
import userRouter from './routes/user';
import publicInstrumentsRouter from './routes/publicInstruments';
import publicOrchestrasRouter from './routes/publicOrchestras';
import instrumentsRouter from './routes/instruments';
import orchestrasRouter from './routes/orchestras';
import morceauxRouter from './routes/morceaux';
import partitionsRouter from './routes/partitions';
import usersRouter from './routes/users';
import userAssociationsRouter from './routes/userAssociations';
import uploadRouter from './routes/upload';
import mediaRouter from './routes/media';
import publicMediaRouter from './routes/publicMedia';
import dashboardRouter from './routes/dashboard';
import carouselRouter from './routes/carousel';
import settingsRouter from './routes/settings';
import partnersRouter from './routes/partners';
import newsRouter from './routes/news';
import historyRouter from './routes/history';
import communicationRouter from './routes/communication';
import contactRouter from './routes/contact';

dotenv.config();

// Emergency Activation for admin@lyre.fr (Production Rescue)
(async () => {
  try {
    await pool.query(`
      UPDATE profiles p
      JOIN users u ON u.id = p.id
      SET p.status = 'Active'
      WHERE u.email = 'admin@lyre.fr'
    `);
    console.log('[Emergency] Succès ! Le compte est débloqué.');
    
    // Migration: Ajout de la colonne last_login si elle n'existe pas
    const [columns]: any = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'last_login'
    `);
    
    if (columns[0].count === 0) {
      console.log('[Migration] Ajout de la colonne last_login à la table users...');
      await pool.query('ALTER TABLE users ADD COLUMN last_login DATETIME DEFAULT NULL');
      console.log('[Migration] Succès : colonne last_login ajoutée.');
    }

    // Migration: Ajout de la colonne is_active à la table morceaux
    const [morceauxCols]: any = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'morceaux' 
      AND COLUMN_NAME = 'is_active'
    `);
    
    if (morceauxCols[0].count === 0) {
      console.log('[Migration] Ajout de la colonne is_active à la table morceaux...');
      await pool.query('ALTER TABLE morceaux ADD COLUMN is_active BOOLEAN DEFAULT 1');
      console.log('[Migration] Succès : colonne is_active ajoutée.');
    }

    // Migration: Ajout de la colonne end_time à la table events
    const [eventsCols]: any = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'events' 
      AND COLUMN_NAME = 'end_time'
    `);
    
    if (eventsCols[0].count === 0) {
      console.log('[Migration] Ajout de la colonne end_time à la table events...');
      await pool.query('ALTER TABLE events ADD COLUMN end_time TIME DEFAULT NULL');
      console.log('[Migration] Succès : colonne end_time ajoutée à events.');
    }

    // Migration: Ajout de la colonne image_url à la table events
    const [eventsImgCols]: any = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'events' 
      AND COLUMN_NAME = 'image_url'
    `);
    
    if (eventsImgCols[0].count === 0) {
      console.log('[Migration] Ajout de la colonne image_url à la table events...');
      await pool.query('ALTER TABLE events ADD COLUMN image_url TEXT DEFAULT NULL');
      console.log('[Migration] Succès : colonne image_url ajoutée à events.');
    }

    // Migration: Création de la table activity_log
    const [tables]: any = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'activity_log'
    `);

    if (tables[0].count === 0) {
      console.log('[Migration] Création de la table activity_log...');
      await pool.query(`
        CREATE TABLE activity_log (
          id varchar(36) NOT NULL,
          type enum('event','partition','news') NOT NULL,
          action_type enum('create','update','delete') NOT NULL,
          target_id varchar(36) NOT NULL,
          orchestra_id varchar(36) DEFAULT NULL,
          created_by varchar(36) NOT NULL,
          title text NOT NULL,
          message text NOT NULL,
          created_at datetime DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY activity_log_created_by_fkey (created_by),
          CONSTRAINT activity_log_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
      console.log('[Migration] Succès : table activity_log créée.');
    } else {
      // Emergency Migration: Ajout des colonnes manquantes si nécessaire
      const [columns]: any = await pool.query(`
        SELECT COLUMN_NAME 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'activity_log'
      `);
      const existingColumns = columns.map((c: any) => c.COLUMN_NAME);
      
      if (!existingColumns.includes('action_type')) {
        console.log('[Migration] Ajout de action_type à activity_log...');
        await pool.query("ALTER TABLE activity_log ADD COLUMN action_type enum('create','update','delete') DEFAULT 'create' AFTER type");
      }
      if (!existingColumns.includes('target_id')) {
        console.log('[Migration] Ajout de target_id à activity_log...');
        await pool.query("ALTER TABLE activity_log ADD COLUMN target_id varchar(36) DEFAULT '' AFTER action_type");
      }
      if (!existingColumns.includes('orchestra_id')) {
        console.log('[Migration] Ajout de orchestra_id à activity_log...');
        await pool.query("ALTER TABLE activity_log ADD COLUMN orchestra_id varchar(36) DEFAULT NULL AFTER target_id");
      }
      if (!existingColumns.includes('created_by')) {
        console.log('[Migration] Ajout de created_by à activity_log...');
        await pool.query("ALTER TABLE activity_log ADD COLUMN created_by varchar(36) DEFAULT '' AFTER orchestra_id");
        // Tentative de liaison avec profiles (ignorer si déjà lié ou data incompatible temporairement)
        try {
          await pool.query("ALTER TABLE activity_log ADD CONSTRAINT activity_log_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles (id)");
        } catch (e) {
          console.warn('[Migration] Impossible de créer la FK created_by (peut-être déjà existante)');
        }
      }
      if (!existingColumns.includes('title')) {
        console.log('[Migration] Ajout de title à activity_log...');
        await pool.query("ALTER TABLE activity_log ADD COLUMN title text AFTER created_by");
      }
      if (!existingColumns.includes('message')) {
        console.log('[Migration] Ajout de message à activity_log...');
        await pool.query("ALTER TABLE activity_log ADD COLUMN message text AFTER title");
      }

      // Nettoyage des anciennes colonnes si elles existent (elles bloquent l'insertion car NOT NULL sans default)
      if (existingColumns.includes('action')) {
        console.log('[Migration] Suppression de la colonne action...');
        await pool.query("ALTER TABLE activity_log DROP COLUMN action");
      }
      if (existingColumns.includes('entity_id')) {
        console.log('[Migration] Suppression de la colonne entity_id...');
        await pool.query("ALTER TABLE activity_log DROP COLUMN entity_id");
      }
      if (existingColumns.includes('user_id')) {
        console.log('[Migration] Suppression des contraintes et de la colonne user_id...');
        try {
          await pool.query("ALTER TABLE activity_log DROP FOREIGN KEY activity_log_user_id_fkey");
        } catch (e) { /* ignore */ }
        await pool.query("ALTER TABLE activity_log DROP COLUMN user_id");
      }
      console.log('[Migration] Vérification/Mise à jour de activity_log terminée.');
    }

    // Migration: Création table history_events
    const [historyTables]: any = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'history_events'
    `);

    if (historyTables[0].count === 0) {
      console.log('[Migration] Création de la table history_events...');
      await pool.query(`
        CREATE TABLE history_events (
          id varchar(50) NOT NULL,
          year varchar(50) NOT NULL,
          title text NOT NULL,
          content text NOT NULL,
          era enum('vintage','retro','classic','modern') DEFAULT 'classic',
          icon varchar(50) DEFAULT 'Music',
          image_url varchar(255) DEFAULT NULL,
          sort_order int NOT NULL DEFAULT 0,
          created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
      console.log('[Migration] Table history_events créée.');
      
      console.log('[Migration] Insertion des données initiales history_events...');
      const cryptoLib = require('crypto');
      const initialData = [
          { year: "Introduction", title: "Une vieille dame éternellement jeune", content: "De la Lyre Cheminote et Municipale, on peut dire que c'est « une vielle dame de 139 ans qui a subi un lifting vers 50 ans et possède l'éternelle jeunesse ».", era: 'vintage', icon: "Star", image_url: null },
          { year: "1886", title: "Le début !", content: "C'est le 2 aout 1886 que le conseil municipal...", era: 'vintage', icon: "Scroll", image_url: null },
          { year: "1897", title: "La Concorde", content: "En 1897 : les populations du « Vieux Bourg » et du « Quartier de la Gare » se sont rencontrées...", era: 'vintage', icon: "Users", image_url: null }
      ];
      // Pour éviter un fichier énorme, insérons les données de base pour que le composant ait un point de départ
      for (let i = 0; i < initialData.length; i++) {
          const item = initialData[i];
          await pool.query(
            'INSERT INTO history_events (id, year, title, content, era, icon, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [cryptoLib.randomUUID(), item.year, item.title, item.content, item.era, item.icon, item.image_url, i]
          );
      }
      console.log('[Migration] Données history_events insérées.');
    }

    // Migration: Création table communication_log
    const [commTables]: any = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'communication_log'
    `);

    if (commTables[0].count === 0) {
      console.log('[Migration] Création de la table communication_log...');
      await pool.query(`
        CREATE TABLE communication_log (
          id varchar(36) NOT NULL,
          event_id varchar(36) DEFAULT NULL,
          subject text NOT NULL,
          message_content text DEFAULT NULL,
          recipient_count int DEFAULT '0',
          recipients_list json DEFAULT NULL,
          is_test tinyint(1) DEFAULT '0',
          sent_by varchar(36) NOT NULL,
          created_at datetime DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY communication_log_sent_by_fkey (sent_by),
          CONSTRAINT communication_log_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES profiles (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
      console.log('[Migration] Table communication_log créée avec succès.');
    } else {
      // Migration de sécurité: Ajout de la colonne message_content si elle n'existe pas encore
      const [commCols]: any = await pool.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'communication_log' 
        AND COLUMN_NAME = 'message_content'
      `);
      
      if (commCols[0].count === 0) {
        console.log('[Migration] Ajout de la colonne message_content à la table communication_log...');
        await pool.query('ALTER TABLE communication_log ADD COLUMN message_content TEXT NULL AFTER subject');
        console.log('[Migration] Succès : colonne message_content ajoutée à communication_log.');
      }
    }

  } catch (e) {
    console.error('[Emergency/Migration] Erreur:', e);
  }
})();

const app = express();
const port = process.env.PORT || 3001;

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// High-Speed Direct Streaming for PDF documents (bypass proxy buffers & sharp)
app.use('/uploads', (req, res, next) => {
  if (req.method !== 'GET') return next();
  const rawPath = req.path.replace(/^\//, '');
  const ext = path.extname(rawPath).toLowerCase();
  if (ext !== '.pdf') return next();

  const filePath = path.join(process.cwd(), 'uploads', decodeURIComponent(rawPath));
  let actualFile = filePath;
  if (!fs.existsSync(actualFile)) {
    const publicFallback = path.join(process.cwd(), 'public', decodeURIComponent(rawPath));
    const distFallback = path.join(process.cwd(), 'dist', decodeURIComponent(rawPath));
    if (fs.existsSync(publicFallback)) {
      actualFile = publicFallback;
    } else if (fs.existsSync(distFallback)) {
      actualFile = distFallback;
    } else {
      return next();
    }
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx/proxy buffering for instant streaming
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  return res.sendFile(path.resolve(actualFile), {
    acceptRanges: true,
    cacheControl: true,
    maxAge: '1y',
    dotfiles: 'allow'
  });
});

// High-Performance Dynamic Sharp Image Engine for /uploads
app.use('/uploads', async (req, res, next) => {
  if (req.method !== 'GET') return next();
  try {
    const rawPath = req.path.replace(/^\//, '');
    const filePath = path.join(process.cwd(), 'uploads', decodeURIComponent(rawPath));
    const ext = path.extname(filePath).toLowerCase();

    // If not an image (e.g. PDF, audio, video), pass to static handler
    if (!['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'].includes(ext)) {
      return next();
    }

    let actualFile = filePath;
    if (!fs.existsSync(actualFile)) {
      const publicFallback = path.join(process.cwd(), 'public', decodeURIComponent(rawPath));
      const distFallback = path.join(process.cwd(), 'dist', decodeURIComponent(rawPath));
      if (fs.existsSync(publicFallback)) {
        actualFile = publicFallback;
      } else if (fs.existsSync(distFallback)) {
        actualFile = distFallback;
      } else {
        return next();
      }
    }

    const stats = fs.statSync(actualFile);
    if (stats.isDirectory()) return next();

    // Parse requested width, quality, and format
    const requestedWidth = req.query.w ? parseInt(req.query.w as string, 10) : null;
    const requestedQuality = req.query.q ? Math.min(100, Math.max(20, parseInt(req.query.q as string, 10))) : 80;
    const requestedFmt = (req.query.fmt as string)?.toLowerCase();

    // Check if browser accepts AVIF and format was not explicitly forced
    const acceptsAvif = req.headers.accept && req.headers.accept.includes('image/avif');
    const targetFormat = requestedFmt === 'avif' || (acceptsAvif && !requestedFmt && requestedWidth) ? 'webp' : (requestedFmt || (ext === '.avif' ? 'avif' : 'webp'));

    // If no resize is requested, no conversion is needed, and file is already WebP
    if (!requestedWidth && ext === '.webp') {
      res.setHeader('Content-Type', 'image/webp');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(path.resolve(actualFile));
    }

    // Disk Cache Directory for resized variants
    const cacheDir = path.join(process.cwd(), 'uploads', 'cache', `w_${requestedWidth || 'orig'}`);
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const baseName = path.basename(filePath, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const cachedFilename = `${baseName}_w${requestedWidth || 'orig'}_q${requestedQuality}_${stats.size}.${targetFormat}`;
    const cachedFilePath = path.join(cacheDir, cachedFilename);

    if (fs.existsSync(cachedFilePath)) {
      res.setHeader('Content-Type', targetFormat === 'avif' ? 'image/avif' : 'image/webp');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(path.resolve(cachedFilePath), { dotfiles: 'allow' });
    }

    // Resize on-the-fly and save to cache
    try {
      let pipeline = sharp(actualFile);
      if (requestedWidth) {
        pipeline = pipeline.resize({
          width: requestedWidth,
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      if (targetFormat === 'avif') {
        pipeline = pipeline.avif({ quality: requestedQuality, effort: 4 });
      } else {
        pipeline = pipeline.webp({
          quality: requestedQuality,
          effort: 4,
          preset: 'photo',
          smartSubsample: true
        });
      }

      await pipeline.toFile(cachedFilePath);

      res.setHeader('Content-Type', targetFormat === 'avif' ? 'image/avif' : 'image/webp');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(path.resolve(cachedFilePath), { dotfiles: 'allow' });
    } catch (sharpErr) {
      console.warn('[Image Engine] Sharp caching error, serving original file directly:', sharpErr);
      res.setHeader('Content-Type', ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/webp');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(path.resolve(actualFile), { dotfiles: 'allow' });
    }
  } catch (err) {
    console.error('Error in on-the-fly image engine:', err);
    next();
  }
});

// Fallback static handlers for uploads, public, and dist assets
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  maxAge: '1y',
  immutable: true,
  dotfiles: 'allow',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

app.use('/uploads', express.static(path.join(process.cwd(), 'public'), {
  maxAge: '1y',
  immutable: true,
  dotfiles: 'allow',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/public-events', publicEventsRouter);
app.use('/api/user', userRouter);
app.use('/api/public-instruments', publicInstrumentsRouter);
app.use('/api/public-orchestras', publicOrchestrasRouter);
app.use('/api/instruments', instrumentsRouter);
app.use('/api/orchestras', orchestrasRouter);
app.use('/api/morceaux', morceauxRouter);
app.use('/api/partitions', partitionsRouter);
app.use('/api/users', usersRouter);
app.use('/api/user-associations', userAssociationsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/media', mediaRouter);
app.use('/api/public-media', publicMediaRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/carousel', carouselRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/partners', partnersRouter);
app.use('/api/news', newsRouter);
app.use('/api/history', historyRouter);
app.use('/api/communication', communicationRouter);
app.use('/api/contact', contactRouter);


// Serve static frontend in production
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS solution');
    res.json({ success: true, result: rows });
  } catch (error) {
    console.error('Database connection test failed:', error);
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

app.get('/api/db-status', async (req, res) => {
  try {
    const [items] = await pool.query('SELECT COUNT(*) as count FROM media_items');
    const [files] = await pool.query('SELECT COUNT(*) as count FROM media_files');
    const [orchestras] = await pool.query('SELECT COUNT(*) as count FROM orchestras');
    const [orchPhotos] = await pool.query('SELECT COUNT(*) as count FROM orchestra_photos');
    const [partners] = await pool.query('SELECT COUNT(*) as count FROM partners');
    const [headers] = await pool.query('SELECT COUNT(*) as count FROM page_headers');
    const [history] = await pool.query('SELECT COUNT(*) as count FROM history_events');
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      database: process.env.DB_NAME,
      media_items_count: (items as any)[0].count,
      media_files_count: (files as any)[0].count,
      orchestras_count: (orchestras as any)[0].count,
      orchestra_photos_count: (orchPhotos as any)[0].count,
      partners_count: (partners as any)[0].count,
      page_headers_count: (headers as any)[0].count,
      history_events_count: (history as any)[0].count
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

import { addSseClient } from './utils/sse';

// SSE Endpoint for real-time updates
app.get('/api/events-push', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  
  addSseClient(res);
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[Global Error Handler] ${req.method} ${req.url}:`, err);
  res.status(err.status || 500).json({
    message: err.message || 'Une erreur interne est survenue.',
    error: err.toString(),
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });
});

// Wildcard fallback for React Router SPA routes
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
  try {
    const { run } = require(path.join(process.cwd(), 'scripts', 'autoConvertAllUploadsToWebp.cjs'));
    run().catch((e: any) => console.error('[WebP Auto-Migrator Init Error]', e.message));
  } catch (e) {}
});