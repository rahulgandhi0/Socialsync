import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Base rate limiter configuration
const baseConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
};

// General API rate limiter
export const apiLimiter = rateLimit({
  ...baseConfig,
  max: 100, // Limit each IP to 100 requests per windowMs
});

// Authentication endpoints rate limiter
export const authLimiter = rateLimit({
  ...baseConfig,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 login attempts per hour
  message: {
    status: 'error',
    message: 'Too many login attempts, please try again later',
  },
});

// Instagram API rate limiter
export const instagramLimiter = rateLimit({
  ...baseConfig,
  max: 200, // Instagram Graph API has a rate limit of 200 requests per user per hour
  keyGenerator: (req: Request): string => {
    // Use user ID as key if available, otherwise fall back to IP
    return req.user?.id || req.ip;
  },
});

// Analytics endpoints rate limiter
export const analyticsLimiter = rateLimit({
  ...baseConfig,
  max: 50, // Limit analytics requests
  skipFailedRequests: true, // Don't count failed requests
}); 