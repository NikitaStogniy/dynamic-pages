import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { users, sessions, type User, type Session } from '@/lib/db/schema';
import { eq, and, gt, lt } from 'drizzle-orm';
import { PASSWORD_CONFIG, SESSION_CONFIG } from '@/lib/constants';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_CONFIG.SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  return uuidv4();
}

export async function createSession(userId: number): Promise<Session> {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_CONFIG.DURATION_MS);

  const [session] = await db.insert(sessions).values({
    sessionToken,
    userId,
    expiresAt,
  }).returning();

  return session;
}

export async function validateSession(sessionToken: string): Promise<{ user: User; session: Session } | null> {
  const [sessionWithUser] = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.sessionToken, sessionToken),
        gt(sessions.expiresAt, new Date())
      )
    );

  if (!sessionWithUser) {
    return null;
  }

  return {
    user: sessionWithUser.user,
    session: sessionWithUser.session,
  };
}

export async function deleteSession(sessionToken: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user || null;
}

export async function createUser(email: string, password: string): Promise<User> {
  const passwordHash = await hashPassword(password);
  
  const [user] = await db.insert(users).values({
    email,
    passwordHash,
    emailVerified: false,
  }).returning();

  return user;
}

export async function cleanExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}