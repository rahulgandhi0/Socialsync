import { z } from 'zod';

// Base schema for media URLs
const mediaUrlSchema = z.string().url().max(2048);

// Schema for post scheduling
export const schedulePostSchema = z.object({
  body: z.object({
    mediaUrls: z.array(mediaUrlSchema)
      .min(1, 'At least one media URL is required')
      .max(10, 'Maximum 10 media items allowed'),
    caption: z.string()
      .min(1, 'Caption is required')
      .max(2200, 'Caption must be less than 2200 characters'),
    scheduledTime: z.string()
      .datetime()
      .refine(
        (date) => new Date(date) > new Date(),
        'Scheduled time must be in the future'
      ),
  }),
});

// Schema for Instagram auth callback
export const authCallbackSchema = z.object({
  query: z.object({
    code: z.string().min(1, 'Authorization code is required'),
    state: z.string().min(1, 'State parameter is required'),
  }),
});

// Schema for analytics request
export const analyticsRequestSchema = z.object({
  query: z.object({
    startDate: z.string()
      .datetime()
      .optional(),
    endDate: z.string()
      .datetime()
      .optional(),
    metrics: z.array(z.string())
      .optional(),
  }),
});

// Schema for post update
export const updatePostSchema = z.object({
  params: z.object({
    postId: z.string().uuid('Invalid post ID'),
  }),
  body: z.object({
    caption: z.string()
      .min(1, 'Caption is required')
      .max(2200, 'Caption must be less than 2200 characters')
      .optional(),
    scheduledTime: z.string()
      .datetime()
      .refine(
        (date) => new Date(date) > new Date(),
        'Scheduled time must be in the future'
      )
      .optional(),
  }),
});

// Schema for post deletion
export const deletePostSchema = z.object({
  params: z.object({
    postId: z.string().uuid('Invalid post ID'),
  }),
}); 