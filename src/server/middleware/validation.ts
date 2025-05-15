import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sanitize } from 'isomorphic-dompurify';

/**
 * Validate request against a Zod schema
 */
export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize input data
      const sanitizedData = {
        body: sanitizeObject(req.body),
        query: sanitizeObject(req.query),
        params: sanitizeObject(req.params),
      };

      // Validate against schema
      await schema.parseAsync(sanitizedData);
      
      // Update request with sanitized data
      req.body = sanitizedData.body;
      req.query = sanitizedData.query;
      req.params = sanitizedData.params;
      
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid request data',
          errors: error.errors,
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error during validation',
      });
    }
  };
};

/**
 * Recursively sanitize an object's string values
 */
function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitize(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  return Object.keys(obj).reduce((acc, key) => {
    acc[key] = sanitizeObject(obj[key]);
    return acc;
  }, {} as any);
} 