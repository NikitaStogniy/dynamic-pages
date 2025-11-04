/**
 * Application-wide constants
 */

// User limits
export const USER_LIMITS = {
  MAX_PAGES: 5,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  MAX_SLUG_GENERATION_ATTEMPTS: 10,
} as const;

// Session configuration
export const SESSION_CONFIG = {
  DURATION_MS: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  COOKIE_NAME: 'session_token',
  COOKIE_MAX_AGE: 7 * 24 * 60 * 60, // 7 days in seconds
} as const;

// Password configuration
export const PASSWORD_CONFIG = {
  SALT_ROUNDS: 10,
  MIN_LENGTH: 8,
  MAX_LENGTH: 100,
} as const;

// Slug configuration
export const SLUG_CONFIG = {
  LENGTH: 8,
  CHARS: 'abcdefghijklmnopqrstuvwxyz0123456789',
} as const;

// File upload configuration
export const UPLOAD_CONFIG = {
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  MAX_SIZE: USER_LIMITS.MAX_FILE_SIZE,
} as const;

// API configuration
export const API_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
