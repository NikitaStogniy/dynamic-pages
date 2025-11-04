# Security Policy

## Overview

This document describes the security measures implemented in the Dynamic Pages application and provides guidelines for maintaining security.

## Implemented Security Features

### 1. Authentication & Session Management ✅

#### HttpOnly Cookies
- **Implementation**: Sessions are stored in httpOnly cookies, preventing XSS attacks
- **Location**: [lib/auth/session.ts](lib/auth/session.ts)
- **Features**:
  - `httpOnly: true` - Prevents JavaScript access
  - `secure: true` (production) - HTTPS only
  - `sameSite: 'lax'` - CSRF protection
  - 7-day expiration with automatic refresh

#### JWT Encryption
- **Library**: `jose` for secure JWT signing/verification
- **Algorithm**: HS256
- **Secret**: Stored in `SESSION_SECRET` environment variable
- **Payload**: `{ userId, email, expiresAt }`

#### Server-Side Auth
- **Location**: [middleware.ts:40-43](middleware.ts#L40-L43)
- **Features**:
  - Real session validation on every request
  - Automatic redirects for unauthenticated users
  - Protected routes enforcement
  - Session refresh when > 50% expired

### 2. Input Validation ✅

#### Zod Schemas
- **Location**: [lib/validation/schemas.ts](lib/validation/schemas.ts)
- **Validation Rules**:
  - Email format validation
  - Password length: 8-100 characters
  - Slug format: 8 alphanumeric characters
  - File size: max 10MB
  - File types: images only

#### API Validation
- All API routes validate input with Zod
- Structured error responses with field-level details
- Example: [app/api/pages/route.ts:84-93](app/api/pages/route.ts#L84-L93)

### 3. Database Security ✅

#### SQL Injection Prevention
- **ORM**: Drizzle with parameterized queries
- **No raw SQL**: All queries use type-safe builders

#### Credentials Management
- ❌ **REMOVED**: Hardcoded credentials from code
- ✅ **ADDED**: Environment variable validation
- ✅ **ADDED**: `.env.example` template
- **Location**: [drizzle.config.ts:3-5](drizzle.config.ts#L3-L5)

#### Cascade Deletes
- User deletion cascades to sessions, pages, and files
- **Schema**: [lib/db/schema.ts](lib/db/schema.ts)

### 4. File Upload Security ✅

#### Validation
- **Location**: [app/api/upload/route.ts:35-44](app/api/upload/route.ts#L35-L44)
- **Checks**:
  - File size limit: 10MB
  - MIME type whitelist: images only
  - Authentication required
  - File ownership tracking

#### Storage
- **Service**: Uploadcare CDN
- **Benefits**:
  - Automatic image optimization
  - CDN delivery
  - No local storage vulnerabilities

### 5. XSS Protection ✅

#### Content Sanitization
- **Library**: `isomorphic-dompurify`
- **Usage**: All user-generated HTML is sanitized before rendering
- **Location**: [components/editor/EditorJSRenderer.tsx](components/editor/EditorJSRenderer.tsx)

#### Security Headers
- Content Security Policy via Next.js
- X-Frame-Options
- X-Content-Type-Options

### 6. CSRF Protection ✅

#### SameSite Cookies
- All cookies use `sameSite: 'lax'`
- Prevents cross-site request forgery
- **Location**: [lib/auth/session.ts:49](lib/auth/session.ts#L49)

#### Origin Validation
- Next.js automatic CSRF protection for Server Actions
- Same-origin policy enforced

### 7. Error Handling ✅

#### Production Mode
- Debug logs only in development
- Generic error messages in production
- No stack traces exposed to clients
- **Pattern**: `if (process.env.NODE_ENV === 'development')`

#### Error Responses
```typescript
// Bad (exposes details)
return { error: error.message }

// Good (generic message)
return { error: 'Internal server error' }
```

## Security Checklist

### Before Deploying to Production

- [ ] **Rotate all credentials** from [.env.local](/.env.local)
  - Database credentials (Neon)
  - Uploadcare keys
  - Session secret
- [ ] **Set SESSION_SECRET** environment variable
  - Generate: `openssl rand -base64 32`
  - Add to production environment
- [ ] **Enable HTTPS** (automatic on Vercel/Netlify)
- [ ] **Configure CORS** if using custom domain
- [ ] **Review user permissions** in database
- [ ] **Set up monitoring** (Sentry recommended)
- [ ] **Configure backup strategy** for database
- [ ] **Set up rate limiting** (see recommendations below)

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://...
UPLOADCARE_PUBLIC_KEY=...
UPLOADCARE_SECRET_KEY=...
SESSION_SECRET=... # Generate with: openssl rand -base64 32

# Optional
NODE_ENV=production
APP_URL=https://yourdomain.com
```

## Recommended Additional Security Measures

### 1. Rate Limiting

**Why**: Prevent brute force attacks and DDoS

**Implementation Options**:

```typescript
// Option A: Upstash Rate Limit (Serverless-friendly)
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

// Option B: In-memory (single server only)
import { LRUCache } from "lru-cache";

const rateLimitCache = new LRUCache({
  max: 500,
  ttl: 60000, // 1 minute
});
```

**Apply to**:
- `/api/auth/signin` - 5 attempts per 15 minutes
- `/api/auth/signup` - 3 attempts per hour
- `/api/pages` - 30 requests per minute
- `/api/upload` - 10 uploads per hour

### 2. Email Verification

**Status**: Schema includes `emailVerified` field, not yet implemented

**Todo**:
1. Send verification email on signup
2. Generate secure verification token
3. Block sensitive actions until verified

### 3. Two-Factor Authentication (2FA)

**Recommended for admin accounts**

**Implementation**:
- Use `@otplib/preset-default` for TOTP
- Store secret in encrypted form
- Add backup codes

### 4. Password Requirements

**Current**: Min 8 characters
**Recommended**:
- At least one uppercase letter
- At least one number
- At least one special character
- Check against common passwords list

**Implementation**:
```typescript
const strongPasswordSchema = z.string()
  .min(12)
  .regex(/[A-Z]/, "Must contain uppercase")
  .regex(/[a-z]/, "Must contain lowercase")
  .regex(/[0-9]/, "Must contain number")
  .regex(/[^A-Za-z0-9]/, "Must contain special char");
```

### 5. Security Headers

**Add to `next.config.ts`**:
```typescript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
];
```

### 6. Audit Logging

**Log security events**:
- Failed login attempts
- Password changes
- Account deletions
- Permission changes
- Suspicious activities

### 7. Dependency Updates

**Schedule**:
- Weekly: `npm audit`
- Monthly: `npm outdated`
- Quarterly: Major version updates

**Commands**:
```bash
npm audit --production
npm audit fix
npm outdated
```

## Vulnerability Reporting

If you discover a security vulnerability, please email security@yourdomain.com.

**Please include**:
1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

**We will**:
1. Acknowledge within 24 hours
2. Provide fix timeline within 7 days
3. Credit you in release notes (if desired)

## Security Updates

This application is built with:
- **Next.js 15.5.3** - Latest stable
- **React 19.1.0** - Latest stable
- **Drizzle ORM 0.44.5** - Actively maintained
- **Zod 4.1.8** - Actively maintained

**Update policy**: Security patches applied within 48 hours of release.

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Guidelines](https://nextjs.org/docs/app/building-your-application/security)
- [Drizzle Security Best Practices](https://orm.drizzle.team/docs/goodies#security)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

## License

This security policy is part of the Dynamic Pages project.
