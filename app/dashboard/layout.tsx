"use client";

import { useAuth } from "@/lib/auth/context-new";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen">
        {/* Sidebar skeleton - hidden on mobile */}
        <div className="hidden md:block w-64 border-r p-4 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 flex items-center justify-center pb-20 md:pb-0">
          <div className="text-lg text-muted-foreground">Загрузка...</div>
        </div>
        {/* Bottom nav skeleton - visible only on mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card h-16" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">
          Redirecting to sign in...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
