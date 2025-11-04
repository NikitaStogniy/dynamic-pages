# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev          # Start development server with Turbopack (port 3000)
npm run build        # Build production application with Turbopack
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Management
```bash
npm run db:generate  # Generate Drizzle migrations from schema changes
npm run db:push      # Push schema changes directly to database (dev)
npm run db:migrate   # Run migrations (production)
npm run db:studio    # Open Drizzle Studio for database management
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.5.3 with App Router and Turbopack
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: Custom session-based auth with httpOnly cookies (JWT)
- **Editor**: Editor.js with block-based editing
- **Styling**: Tailwind CSS v4
- **Storage**: Uploadcare for file uploads
- **Additional**: QR code generation (client-side)

### Core Database Schema
- **users**: User accounts with email/password authentication
- **pages**: User-created pages with Editor.js content (JSONB), random 8-char slugs, userId ownership
- **uploadcareFiles**: File upload metadata and CDN URLs
- **cronJobs**: Scheduled task management
- **telegramUsers**: Telegram integration data

### Authentication Flow
- Session tokens stored in httpOnly cookies (`session_token`)
- JWT-based authentication using jose library
- Session validation via `verifySession()` from `@/lib/auth/session`
- Middleware automatically protects `/dashboard/*` routes
- Cookies sent automatically with `credentials: 'include'` in fetch requests
- Sessions auto-refresh when more than half the duration has passed

### Page Management System
- Pages owned by users (userId foreign key with cascade delete)
- Random 8-character alphanumeric slugs (generated client-side)
- Content stored as Editor.js OutputData in PostgreSQL JSONB column
- Public pages accessible at `/p/[slug]` when `isPublished = true`
- Edit interface at `/dashboard/pages/[slug]/edit`
- No meta descriptions or SEO fields

### API Route Authentication Pattern
All protected API routes follow this pattern:
```typescript
import { verifySession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  // 1. Verify session from httpOnly cookie
  const session = await verifySession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Use session.userId to scope operations
  const userId = session.userId;
  // ... your logic
}
```

Client-side requests must include `credentials: 'include'`:
```typescript
fetch('/api/endpoint', {
  method: 'POST',
  credentials: 'include', // Required for cookies!
  body: JSON.stringify(data)
});
```

### Editor.js Configuration
- Block-based editor with modular architecture
- Tools: Header, List, Checklist, Quote, Code, Image, Table, Embed, and more
- Content stored as OutputData format with blocks array
- Supports read-only mode for public page viewing
- Image uploads go through `/api/upload` → Uploadcare CDN

### File Upload System
- Images uploaded to Uploadcare CDN via `/api/upload`
- Metadata stored in `uploadcareFiles` table
- Maximum file size: 10MB (configurable in `UPLOAD_CONFIG`)
- Allowed types: JPEG, PNG, GIF, WebP
- Editor.js image tool returns: `{ success: 1, file: { url: string } }`

### Key Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (Neon)
- `SESSION_SECRET`: Secret key for JWT token encryption
- `UPLOADCARE_PUBLIC_KEY`: Uploadcare CDN public key for file uploads

### Important Notes
- Always run `npm run db:push` after schema changes during development
- Pages table requires userId - ensure migrations are run before testing
- Editor.js content must be OutputData format with blocks array
- Random slugs are generated client-side, not database-side
- All API requests requiring auth must use `credentials: 'include'`
- Image uploads require valid session (authenticated users only)
- See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for localStorage → httpOnly cookie migration details