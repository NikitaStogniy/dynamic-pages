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
- **Authentication**: Custom session-based auth stored in localStorage
- **Editor**: Editor.js with block-based editing
- **Styling**: Tailwind CSS v4
- **Additional**: Telegram bot integration, QR code generation, cron jobs

### Core Database Schema
- **users**: User accounts with email/password authentication
- **sessions**: Session tokens for authentication
- **pages**: User-created pages with Editor.js content (JSONB), random 8-char slugs, userId ownership
- **qrCodes**: QR code tracking system
- **cronJobs**: Scheduled task management
- **telegramUsers**: Telegram integration data

### Authentication Flow
- Session tokens stored in localStorage (`sessionToken` key)
- All protected routes require Bearer token in Authorization header
- Session validation happens in API routes via `sessions` table lookup
- Protected routes under `/dashboard/*` enforced by `AuthProvider` context

### Page Management System
- Pages owned by users (userId foreign key with cascade delete)
- Random 8-character alphanumeric slugs (generated client-side)
- Content stored as Editor.js OutputData in PostgreSQL JSONB column
- Public pages accessible at `/p/[slug]` when `isPublished = true`
- Edit interface at `/dashboard/pages/[slug]/edit`
- No meta descriptions or SEO fields

### API Route Authentication Pattern
All protected API routes follow this pattern:
1. Extract Bearer token from Authorization header
2. Validate session exists and hasn't expired
3. Filter/scope operations by session.userId
4. Return 401 for invalid/missing auth

### Editor.js Configuration
- Block-based editor with modular architecture
- Tools: Header, List, Checklist, Quote, Code, Image, Table, Embed, and more
- Content stored as OutputData format with blocks array
- Supports read-only mode for public page viewing

### Key Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (Neon)

### Important Notes
- Always run `npm run db:push` after schema changes during development
- Pages table requires userId - ensure migrations are run before testing
- Editor.js content must be OutputData format with blocks array
- Random slugs are generated client-side, not database-side