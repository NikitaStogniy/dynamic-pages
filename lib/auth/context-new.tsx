'use client';

import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, useSignIn, useSignUp, useSignOut } from '@/lib/hooks/queries/useAuth';
import type { AuthUser } from '@/lib/controllers/auth.controller';

interface AuthContextType {
  user: AuthUser | null | undefined;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading, refetch } = useSession();
  const signInMutation = useSignIn();
  const signUpMutation = useSignUp();
  const signOutMutation = useSignOut();

  const signIn = async (email: string, password: string) => {
    await signInMutation.mutateAsync({ email, password });
  };

  const signUp = async (email: string, password: string) => {
    await signUpMutation.mutateAsync({ email, password });
  };

  const signOut = async () => {
    await signOutMutation.mutateAsync();
  };

  const checkSession = () => {
    refetch();
  };

  // Handle protected routes
  useEffect(() => {
    if (!isLoading) {
      const isProtectedRoute = pathname.startsWith('/dashboard');
      const isAuthRoute = pathname === '/signin' || pathname === '/signup';
      
      if (isProtectedRoute && !user) {
        router.push('/signin');
      } else if (isAuthRoute && user) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  return (
    <AuthContext.Provider 
      value={{ 
        user: user || null, 
        loading: isLoading, 
        signIn, 
        signUp, 
        signOut, 
        checkSession 
      }}
    >
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