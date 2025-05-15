import * as Sentry from '@sentry/react';

// Custom error types
export class InstagramError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'InstagramError';
  }
}

export class MediaError extends InstagramError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'MEDIA_ERROR', context);
    this.name = 'MediaError';
  }
}

export class AuthenticationError extends InstagramError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'AUTH_ERROR', context);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends InstagramError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'RATE_LIMIT', context);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends InstagramError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

// Error messages
export const ErrorMessages = {
  MEDIA_UPLOAD_FAILED: 'Failed to upload media to Instagram',
  INVALID_MEDIA: 'Invalid media format or size',
  AUTH_FAILED: 'Instagram authentication failed',
  RATE_LIMIT_EXCEEDED: 'Instagram API rate limit exceeded',
  POST_CREATION_FAILED: 'Failed to create Instagram post',
  POST_PUBLISH_FAILED: 'Failed to publish Instagram post',
  INVALID_CAPTION: 'Invalid caption format or length',
  SCHEDULING_FAILED: 'Failed to schedule Instagram post',
  NETWORK_ERROR: 'Network error occurred',
  UNKNOWN_ERROR: 'An unknown error occurred',
} as const;

// Error handler
export function handleError(error: any, context?: Record<string, any>) {
  // Add breadcrumb for debugging
  Sentry.addBreadcrumb({
    category: 'error',
    message: error.message,
    level: 'error',
    data: context,
  });

  // Determine error type
  let finalError: InstagramError;
  if (error instanceof InstagramError) {
    finalError = error;
  } else if (error.response?.status === 429) {
    finalError = new RateLimitError(ErrorMessages.RATE_LIMIT_EXCEEDED, {
      ...context,
      retryAfter: error.response.headers['retry-after'],
    });
  } else if (error.response?.status === 401) {
    finalError = new AuthenticationError(ErrorMessages.AUTH_FAILED, context);
  } else {
    finalError = new InstagramError(
      error.message || ErrorMessages.UNKNOWN_ERROR,
      'UNKNOWN_ERROR',
      context
    );
  }

  // Capture exception in Sentry
  Sentry.withScope((scope) => {
    scope.setTag('error_type', finalError.name);
    scope.setTag('error_code', finalError.code);
    if (finalError.context) {
      scope.setContext('error_context', finalError.context);
    }
    Sentry.captureException(finalError);
  });

  return finalError;
}

// Rate limiting utilities
const rateLimits = new Map<string, number>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Clean up old entries
  rateLimits.forEach((timestamp, k) => {
    if (timestamp < windowStart) {
      rateLimits.delete(k);
    }
  });
  
  // Check current count
  const count = Array.from(rateLimits.entries())
    .filter(([k, t]) => k.startsWith(key) && t >= windowStart)
    .length;
    
  if (count >= limit) {
    return false;
  }
  
  // Add new entry
  rateLimits.set(`${key}_${now}`, now);
  return true;
}

// Network error recovery
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors
      if (
        error instanceof AuthenticationError ||
        error instanceof ValidationError
      ) {
        throw error;
      }
      
      // Add retry breadcrumb
      Sentry.addBreadcrumb({
        category: 'retry',
        message: `Retry attempt ${attempt} of ${maxRetries}`,
        level: 'info',
        data: { error: error.message },
      });
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  throw lastError;
} 