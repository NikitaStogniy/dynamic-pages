'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authController } from '@/lib/controllers/auth.controller';
import type { AuthUser } from '@/lib/controllers/auth.controller';

export const AUTH_QUERY_KEY = ['auth', 'session'] as const;

/**
 * Hook to check current session
 */
export function useSession() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: () => authController.checkSession(),
    staleTime: 5 * 60 * 1000, // Consider session fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

/**
 * Hook to sign in
 */
export function useSignIn() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authController.signIn(email, password),
    onSuccess: (user) => {
      // Update the session query cache
      queryClient.setQueryData<AuthUser | null>(AUTH_QUERY_KEY, user);
      
      // Invalidate any pages queries since we have a new session
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      
      // Navigate to dashboard
      router.push('/dashboard');
    },
  });
}

/**
 * Hook to sign up
 */
export function useSignUp() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authController.signUp(email, password),
    onSuccess: (user) => {
      // Update the session query cache
      queryClient.setQueryData<AuthUser | null>(AUTH_QUERY_KEY, user);
      
      // Navigate to dashboard
      router.push('/dashboard');
    },
  });
}

/**
 * Hook to sign out
 */
export function useSignOut() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authController.signOut(),
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
      
      // Navigate to sign in page
      router.push('/signin');
    },
  });
}

/**
 * Hook to get authentication status
 */
export function useIsAuthenticated() {
  const { data: session, isLoading } = useSession();
  
  return {
    isAuthenticated: !!session,
    isLoading,
    user: session,
  };
}