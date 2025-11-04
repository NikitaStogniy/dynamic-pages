import { z } from 'zod';
import { SLUG_CONFIG, PASSWORD_CONFIG } from '@/lib/constants';

/**
 * Schema for creating a new page
 */
export const createPageSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  slug: z.string()
    .regex(
      new RegExp(`^[${SLUG_CONFIG.CHARS}]{${SLUG_CONFIG.LENGTH}}$`),
      'Invalid slug format'
    ),
  content: z.object({
    blocks: z.array(z.any()),
    time: z.number().optional(),
    version: z.string().optional(),
  }).optional().default({ blocks: [] }),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;

/**
 * Schema for updating a page
 */
export const updatePageSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  content: z.object({
    blocks: z.array(z.any()),
    time: z.number().optional(),
    version: z.string().optional(),
  }).optional(),
});

export type UpdatePageInput = z.infer<typeof updatePageSchema>;

/**
 * Schema for sign up
 */
export const signUpSchemaExtended = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(PASSWORD_CONFIG.MIN_LENGTH, `Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters`)
    .max(PASSWORD_CONFIG.MAX_LENGTH, `Password must be less than ${PASSWORD_CONFIG.MAX_LENGTH} characters`),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

export type SignUpInput = z.infer<typeof signUpSchemaExtended>;

/**
 * Schema for sign in
 */
export const signInSchemaExtended = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, 'Password is required'),
});

export type SignInInput = z.infer<typeof signInSchemaExtended>;

/**
 * Schema for file upload
 */
export const fileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      'File size must be less than 10MB'
    )
    .refine(
      (file) => [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ].includes(file.type),
      'File must be an image (JPEG, PNG, GIF, or WebP)'
    ),
});

export type FileUploadInput = z.infer<typeof fileUploadSchema>;
