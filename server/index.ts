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
    console.log('[Emergency] SOS: Tentative de super-activation de admin@lyre.fr...');
    await pool.query(`
      UPDATE profiles p
      JOIN users u ON u.id = p.id
      SET p.status = 'Active'
      WHERE u.email = 'admin@lyre.fr'
    `);
    console.log('[Emergency] Succès ! Le compte est débloqué.');
  } catch (e) {
    console.error('[Emergency] Échec:', e);
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