import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { SESSION_CONFIG } from '@/lib/constants';

// Validate SESSION_SECRET exists and meets minimum requirements
const secretKey = process.env.SESSION_SECRET;

if (!secretKey) {
  throw new Error(
    'SESSION_SECRET environment variable is required. ' +
    'Generate a secure secret with: openssl rand -base64 32'
  );
}

if (secretKey.length < 32) {
  throw new Error(
    'SESSION_SECRET must be at least 32 characters long for security. ' +
    'Current length: ' + secretKey.length
  );
}

const encodedKey = new TextEncoder().encode(secretKey);

export type SessionPayload = {
  userId: number;
  email: string;
  expiresAt: Date;
};

/**
 * Encrypts session payload into a JWT token
 */
export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('dynamic-pages-app')
    .setAudience('dynamic-pages-users')
    .setExpirationTime(payload.expiresAt)
    .sign(encodedKey);
}

/**
 * Decrypts and verifies JWT token
 */
export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
      issuer: 'dynamic-pages-app',
      audience: 'dynamic-pages-users',
    });

    return payload as unknown as SessionPayload;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to verify session:', error);
    }
    return null;
  }
}

/**
 * Creates a session and stores it in an httpOnly cookie
 */
export async function createSessionCookie(userId: number, email: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_CONFIG.DURATION_MS);
  const session = await encrypt({ userId, email, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_CONFIG.COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Verifies the session from cookie
 */
export async function verifySession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_CONFIG.COOKIE_NAME)?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    return null;
  }

  return session;
}

/**
 * Deletes the session cookie
 */
export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_CONFIG.COOKIE_NAME);
}

/**
 * Updates the session expiration
 */
export async function updateSession(): Promise<void> {
  const session = await verifySession();

  if (!session) {
    return;
  }

  const expiresAt = new Date(Date.now() + SESSION_CONFIG.DURATION_MS);
  const newSession = await encrypt({
    ...session,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_CONFIG.COOKIE_NAME, newSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}
