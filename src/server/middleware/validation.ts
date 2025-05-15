import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Validate request against a Zod schema
 */
export function validateRequest(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize and validate request body
      const sanitizedBody = Object.keys(req.body).reduce((acc, key) => {
        acc[key] = typeof req.body[key] === 'string' 
          ? DOMPurify.sanitize(req.body[key])
          : req.body[key];
        return acc;
      }, {} as Record<string, unknown>);

      const validatedData = await schema.parseAsync(sanitizedBody);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      } else {
        res.status(500).json({
          error: 'Internal server error during validation',
        });
      }
    }
  };
}

/**
 * Recursively sanitize an object's string values
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      acc[key] = sanitizeObject(obj[key]);
      return acc;
    }, {} as Record<string, any>);
  }

  return obj;
} 