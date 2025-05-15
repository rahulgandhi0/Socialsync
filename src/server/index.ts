import express from 'express';
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

// Security middleware
app.use(helmet()); // Secure HTTP headers
app.use(cors(corsOptions)); // CORS protection
app.use(express.json({ limit: '10mb' })); // Request body parsing with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all routes
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/instagram', instagramLimiter);
app.use('/api/analytics', analyticsLimiter);

// Instagram routes
app.post(
  '/api/instagram/schedule',
  validateRequest(schemas.schedulePostSchema),
  async (req, res) => {
    // Handler implementation
  }
);

app.get(
  '/api/instagram/auth/callback',
  validateRequest(schemas.authCallbackSchema),
  async (req, res) => {
    // Handler implementation
  }
);

app.get(
  '/api/instagram/analytics',
  validateRequest(schemas.analyticsRequestSchema),
  async (req, res) => {
    // Handler implementation
  }
);

app.put(
  '/api/instagram/posts/:postId',
  validateRequest(schemas.updatePostSchema),
  async (req, res) => {
    // Handler implementation
  }
);

app.delete(
  '/api/instagram/posts/:postId',
  validateRequest(schemas.deletePostSchema),
  async (req, res) => {
    // Handler implementation
  }
);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 