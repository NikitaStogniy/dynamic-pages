# Dynamic Pages Setup Guide

## Overview
This Next.js application includes:
- **Drizzle ORM** for PostgreSQL database management
- **Editor.js** for block-based content editing
- **QR Code** generation utilities
- **Node-cron** for scheduled tasks
- **Grammy** for Telegram bot integration

## Quick Start

### 1. Database Setup

1. Install PostgreSQL locally or use a cloud provider (Neon, Supabase, etc.)
2. Update `.env.local` with your database credentials:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/dynamic_pages
```

3. Run database migrations:
```bash
npm run db:push
```

### 2. Telegram Bot Setup

1. Create a bot via [@BotFather](https://t.me/botfather) on Telegram
2. Copy the bot token to `.env.local`:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
APP_URL=https://your-domain.com
```

3. Set up webhook (for production):
```bash
curl -X POST http://localhost:3000/api/telegram/setup \
  -H "Content-Type: application/json" \
  -d '{"action": "setWebhook"}'
```

## API Endpoints

### Pages API
- `GET /api/pages` - List all pages
- `POST /api/pages` - Create a new page
- `GET /api/pages/[slug]` - Get a specific page
- `PUT /api/pages/[slug]` - Update a page
- `DELETE /api/pages/[slug]` - Delete a page

### QR Code API
- `POST /api/qr/generate` - Generate QR code
- `GET /api/qr/generate?text=content` - Generate QR code (GET)
- `GET /api/qr/[code]` - Redirect from QR code

### Cron Jobs API
- `POST /api/cron` - Initialize or manage cron jobs
- `GET /api/cron` - List all cron jobs

### Telegram Bot API
- `POST /api/telegram/webhook` - Webhook endpoint
- `POST /api/telegram/setup` - Configure bot settings

## Database Commands

```bash
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio GUI
```

## Components Usage

### Notion Editor
```tsx
import NotionEditor from '@/components/editor/NotionEditor';

<NotionEditor
  content={pageContent}
  onChange={(content) => setPageContent(content)}
  placeholder="Start typing..."
  editable={true}
/>
```

### QR Code Generation
```typescript
import { generateQRCode } from '@/lib/utils/qrcode';

const qrDataURL = await generateQRCode('https://example.com');
```

## Testing Examples

### Create a Page
```bash
curl -X POST http://localhost:3000/api/pages \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Welcome Page",
    "slug": "welcome",
    "content": {"type": "doc", "content": []},
    "metaDescription": "Welcome to our site",
    "isPublished": true
  }'
```

### Generate QR Code
```bash
curl -X POST http://localhost:3000/api/qr/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "https://example.com", "save": true}'
```

### Initialize Cron Jobs
```bash
curl -X POST http://localhost:3000/api/cron \
  -H "Content-Type: application/json" \
  -d '{"action": "initialize"}'
```

## Production Deployment

1. Set environment variables in your hosting platform
2. Run database migrations
3. Set up Telegram webhook with your production URL
4. Initialize cron jobs after deployment

## Notes

- The editor component requires client-side rendering (`'use client'`)
- Cron jobs run in-memory and need to be initialized on server start
- Telegram bot can work with webhooks (production) or polling (development)
- QR codes can be saved to database for tracking scans