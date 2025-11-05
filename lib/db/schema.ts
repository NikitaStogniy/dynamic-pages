import { pgTable, serial, text, timestamp, jsonb, boolean, integer, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('email_idx').on(table.email),
}));

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  sessionToken: text('session_token').unique().notNull(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tokenIdx: uniqueIndex('token_idx').on(table.sessionToken),
}));

export const pages = pgTable('pages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  slug: text('slug').unique().notNull(),
  content: jsonb('content').notNull().default({}),
  isPublished: boolean('is_published').default(false).notNull(),
  qrExpiryMinutes: integer('qr_expiry_minutes'), // null = no expiry, number = minutes until expiry
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const pageAccessTokens = pgTable('page_access_tokens', {
  id: serial('id').primaryKey(),
  pageId: integer('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tokenIdx: uniqueIndex('page_token_idx').on(table.token),
}));

export const cronJobs = pgTable('cron_jobs', {
  id: serial('id').primaryKey(),
  name: text('name').unique().notNull(),
  schedule: text('schedule').notNull(),
  isActive: boolean('is_active').default(true),
  lastRun: timestamp('last_run'),
  nextRun: timestamp('next_run'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const telegramUsers = pgTable('telegram_users', {
  id: serial('id').primaryKey(),
  telegramId: text('telegram_id').unique().notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  username: text('username'),
  isBot: boolean('is_bot').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const uploadcareFiles = pgTable('uploadcare_files', {
  id: serial('id').primaryKey(),
  fileId: text('file_id').unique().notNull(),
  fileUrl: text('file_url').notNull(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileName: text('file_name'),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  fileIdIdx: uniqueIndex('file_id_idx').on(table.fileId),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type PageAccessToken = typeof pageAccessTokens.$inferSelect;
export type NewPageAccessToken = typeof pageAccessTokens.$inferInsert;
export type CronJob = typeof cronJobs.$inferSelect;
export type NewCronJob = typeof cronJobs.$inferInsert;
export type TelegramUser = typeof telegramUsers.$inferSelect;
export type NewTelegramUser = typeof telegramUsers.$inferInsert;
export type UploadcareFile = typeof uploadcareFiles.$inferSelect;
export type NewUploadcareFile = typeof uploadcareFiles.$inferInsert;