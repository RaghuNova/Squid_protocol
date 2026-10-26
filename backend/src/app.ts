import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { prisma } from './prisma.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import round1Routes from './routes/round1Routes.js';
import round2Routes from './routes/round2Routes.js';
import round3Routes from './routes/round3Routes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import liveRoutes from './routes/liveRoutes.js';

export const app = express();

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Managed per-frontend proxy in development
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173')
  .split(',')
  .map(o => o.trim().replace(/\/+$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    const cleanOrigin = origin.replace(/\/+$/, '');
    const isAllowed = 
      allowedOrigins.includes(cleanOrigin) ||
      cleanOrigin.endsWith('.vercel.app') ||
      process.env.NODE_ENV === 'development';

    if (isAllowed) {
      return callback(null, true);
    }
    console.warn(`[CORS Blocked] Origin "${origin}" not permitted. Allowed:`, allowedOrigins);
    return callback(new Error(`Origin ${origin} not permitted by CORS policy.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[REQ] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
  }
  next();
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Readiness probe
app.get('/health/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'unready',
      database: 'disconnected',
      error: err.message
    });
  }
});

// API Routes (v1)
// Game state is authoritative and changes during live events; prevent browsers
// and intermediary proxies from reusing a cached team or round response.
app.use('/api/v1', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
});
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/round1', round1Routes);
app.use('/api/v1/round2', round2Routes);
app.use('/api/v1/round3', round3Routes);
app.use('/api/v1/leaderboard', leaderboardRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/live', liveRoutes);

// Central error handler
app.use(errorHandler);
