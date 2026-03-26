import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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
      console.log('[Migration] Vérification/Mise à jour de activity_log terminée.');
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

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

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


app.get('/', (req, res) => {
  res.send('Hello from Lyre Backend!');
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

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});