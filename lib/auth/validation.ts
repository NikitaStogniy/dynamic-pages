import { z } from 'zod';
import { PASSWORD_CONFIG } from '@/lib/constants';

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string()
    .min(PASSWORD_CONFIG.MIN_LENGTH, `Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters long`)
    .max(PASSWORD_CONFIG.MAX_LENGTH, `Password must be less than ${PASSWORD_CONFIG.MAX_LENGTH} characters`),
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
