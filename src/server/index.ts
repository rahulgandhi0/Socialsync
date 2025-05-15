import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { corsOptions } from './middleware/cors.js';
import { apiLimiter, authLimiter, instagramLimiter, analyticsLimiter } from './middleware/rateLimit.js';
import { validateRequest } from './middleware/validation.js';
import * as schemas from './schemas/instagram.js';
import { initSentry } from '../lib/sentry.js';
import helmet from 'helmet';

const app = express();

// Initialize Sentry for error tracking
initSentry();

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/instagram/', instagramLimiter);
app.use('/api/analytics/', analyticsLimiter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Instagram endpoints
app.post(
  '/api/instagram/exchange-token',
  validateRequest(schemas.authCallbackSchema),
  async (_req, res) => {
    res.json({ status: 'ok' });
  }
);

app.post(
  '/api/instagram/refresh-token',
  validateRequest(schemas.authCallbackSchema),
  async (_req, res) => {
    res.json({ status: 'ok' });
  }
);

app.post(
  '/api/instagram/publish',
  validateRequest(schemas.schedulePostSchema),
  async (_req, res) => {
    res.json({ status: 'ok' });
  }
);

app.post(
  '/api/instagram/schedule',
  validateRequest(schemas.schedulePostSchema),
  async (_req, res) => {
    res.json({ status: 'ok' });
  }
);

// Error handling
app.use((_error: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: 'Internal server error' });
});

export default app;