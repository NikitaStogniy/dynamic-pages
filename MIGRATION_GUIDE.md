# Migration Guide: localStorage to httpOnly Cookies

This guide explains how to migrate existing client-side code from localStorage-based authentication to the new httpOnly cookie system.

## What Changed?

### Before (localStorage)
```typescript
// Sign in
const response = await fetch('/api/auth/signin', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});
const { sessionToken } = await response.json();
localStorage.setItem('sessionToken', sessionToken);

// API requests
fetch('/api/pages', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`
  }
});

// Sign out
localStorage.removeItem('sessionToken');
await fetch('/api/auth/signout', {
  method: 'POST',
  body: JSON.stringify({ sessionToken }),
});
```

### After (httpOnly Cookies)
```typescript
// Sign in (cookie set automatically)
const response = await fetch('/api/auth/signin', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
  credentials: 'include', // Important!
});
const { user } = await response.json();
// No need to store anything!

// API requests (cookie sent automatically)
fetch('/api/pages', {
  credentials: 'include', // Important!
});

// Sign out (cookie cleared automatically)
await fetch('/api/auth/signout', {
  method: 'POST',
  credentials: 'include',
});
```

## Step-by-Step Migration

### 1. Update Auth Context

**File**: `lib/auth/context-new.tsx`

#### Remove localStorage usage:

```typescript
// ❌ Remove this
const [sessionToken, setSessionToken] = useState<string | null>(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('sessionToken');
  }
  return null;
});

// ✅ Replace with session check from cookie
const [user, setUser] = useState<User | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function checkSession() {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setLoading(false);
    }
  }

  checkSession();
}, []);
```

#### Update signin function:

```typescript
// ❌ Old
async function signin(email: string, password: string) {
  const response = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const { user, sessionToken } = await response.json();
  localStorage.setItem('sessionToken', sessionToken);
  setUser(user);
}

// ✅ New
async function signin(email: string, password: string) {
  const response = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include', // Important!
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const { user } = await response.json();
  setUser(user);
  return user;
}
```

#### Update signout function:

```typescript
// ❌ Old
async function signout() {
  const sessionToken = localStorage.getItem('sessionToken');
  await fetch('/api/auth/signout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken }),
  });

  localStorage.removeItem('sessionToken');
  setUser(null);
}

// ✅ New
async function signout() {
  await fetch('/api/auth/signout', {
    method: 'POST',
    credentials: 'include', // Important!
  });

  setUser(null);
  router.push('/signin');
}
```

### 2. Update API Service

**File**: `lib/services/api.service.ts`

```typescript
// ❌ Old
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const sessionToken = localStorage.getItem('sessionToken');

  return fetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${sessionToken}`,
    },
  });
}

// ✅ New
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  return fetch(endpoint, {
    ...options,
    credentials: 'include', // Cookies sent automatically
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}
```

### 3. Update React Query Hooks

**File**: `lib/hooks/queries/usePages.ts`

```typescript
// ❌ Old
export function usePages() {
  return useQuery({
    queryKey: ['pages'],
    queryFn: async () => {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/pages', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });
      return response.json();
    },
  });
}

// ✅ New
export function usePages() {
  return useQuery({
    queryKey: ['pages'],
    queryFn: async () => {
      const response = await fetch('/api/pages', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pages');
      }

      return response.json();
    },
  });
}
```

### 4. Update Editor.js Image Upload

**File**: `components/editor/EditorJSConfig.ts`

```typescript
// ❌ Old
async uploadByFile(file: File) {
  const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : null;

  if (!sessionToken) {
    throw new Error('Not authenticated');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
    },
    body: formData,
  });

  // ...
}

// ✅ New
async uploadByFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    credentials: 'include', // Cookie sent automatically
    body: formData, // Don't set Content-Type for FormData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  const result = await response.json();
  return {
    success: result.success,
    file: {
      url: result.file.url
    }
  };
}
```

### 5. Remove Authorization Headers from API Routes

Since authentication now happens via cookies, API routes can be simplified:

```typescript
// ❌ Old (Bearer token)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionToken = authHeader.substring(7);
  // Validate token...
}

// ✅ New (Cookie-based)
import { verifySession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use session.userId...
}
```

## Important Notes

### 1. Always Use `credentials: 'include'`

```typescript
fetch('/api/endpoint', {
  credentials: 'include', // Required for cookies!
});
```

Without this, cookies won't be sent with the request.

### 2. CORS Configuration

If using a different domain for API:

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.FRONTEND_URL },
        ],
      },
    ];
  },
};
```

### 3. Server Components

Server Components can directly access session:

```typescript
import { verifySession } from '@/lib/auth/session';

export default async function Page() {
  const session = await verifySession();

  if (!session) {
    redirect('/signin');
  }

  return <div>Hello, {session.email}!</div>;
}
```

### 4. Client Components

Client Components use the session from context:

```typescript
'use client';

import { useAuth } from '@/lib/auth/context-new';

export default function ClientPage() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not signed in</div>;

  return <div>Hello, {user.email}!</div>;
}
```

## Testing the Migration

### 1. Clear localStorage
```typescript
localStorage.clear();
```

### 2. Sign in
- Should work without storing anything in localStorage
- Check browser DevTools > Application > Cookies
- Should see `session_token` cookie with:
  - HttpOnly: ✓
  - Secure: ✓ (production)
  - SameSite: Lax

### 3. Refresh page
- Should remain authenticated
- Session automatically validated by middleware

### 4. Sign out
- Cookie should be deleted
- Redirected to signin page

## Rollback Plan

If issues occur, you can temporarily revert by:

1. Keep old auth routes as `/api/auth/legacy/*`
2. Add feature flag in environment:
   ```
   USE_LEGACY_AUTH=true
   ```
3. Switch auth context based on flag

## Benefits of New System

✅ **More Secure**:
- XSS protection (httpOnly)
- CSRF protection (sameSite)
- No token exposure in JavaScript

✅ **Better UX**:
- Automatic session refresh
- No manual token management
- Works across tabs

✅ **Simpler Code**:
- No localStorage management
- Automatic cookie handling
- Server-side validation

## Questions?

If you encounter issues during migration, check:
1. [SECURITY.md](SECURITY.md) for security details
2. [lib/auth/session.ts](lib/auth/session.ts) for session utilities
3. [middleware.ts](middleware.ts) for auth flow

## Support

For migration help, open an issue with:
- Current implementation details
- Error messages
- Browser console logs
