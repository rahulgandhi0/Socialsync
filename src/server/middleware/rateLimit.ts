import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

// Base configuration for rate limiting
const baseConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (request: Request): string => {
    return request.ip || request.headers['x-forwarded-for']?.toString() || 'unknown';
  },
};

// General API rate limiter
export const apiLimiter = rateLimit({
  ...baseConfig,
  max: 100, // limit each IP to 100 requests per windowMs
});

// Auth endpoints rate limiter (more strict)
export const authLimiter = rateLimit({
  ...baseConfig,
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
});

// Instagram API rate limiter
export const instagramLimiter = rateLimit({
  ...baseConfig,
  max: 50, // limit each IP to 50 requests per windowMs
  message: 'Too many Instagram API requests, please try again later',
});

// Analytics endpoints rate limiter
export const analyticsLimiter = rateLimit({
  ...baseConfig,
  max: 30, // limit each IP to 30 requests per windowMs
  message: 'Too many analytics requests, please try again later',
}); 