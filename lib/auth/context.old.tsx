'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: number;
  email: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TOKEN_KEY = 'sessionToken';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkSession = async () => {
    try {
      const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
      
      if (!sessionToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem(SESSION_TOKEN_KEY);
        setUser(null);
      }
    } catch (error) {
      console.error('Session check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Sign in failed');
    }

    const data = await response.json();
    localStorage.setItem(SESSION_TOKEN_KEY, data.sessionToken);
    setUser(data.user);
    router.push('/dashboard');
  };

  const signUp = async (email: string, password: string) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Sign up failed');
    }

    const data = await response.json();
    localStorage.setItem(SESSION_TOKEN_KEY, data.sessionToken);
    setUser(data.user);
    router.push('/dashboard');
  };

  const signOut = async () => {
    try {
      const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
      
      if (sessionToken) {
        await fetch('/api/auth/signout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken }),
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      setUser(null);
      router.push('/signin');
    }
  };

  // Check session on mount and when pathname changes
  useEffect(() => {
    checkSession();
  }, []);

  // Handle protected routes
  useEffect(() => {
    if (!loading) {
      const isProtectedRoute = pathname.startsWith('/dashboard');
      const isAuthRoute = pathname === '/signin' || pathname === '/signup';
      
      if (isProtectedRoute && !user) {
        router.push('/signin');
      } else if (isAuthRoute && user) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}