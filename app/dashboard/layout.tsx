'use client'

import { useAuth } from '@/lib/auth/context-new';
import { LogoIcon } from "@/components/icons";
import {UserComponent} from '@/components/ui/UserComponent'
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirecting to sign in...</div>
      </div>
    );
  }

  return (
    <div className=" max-w-7xl mx-auto min-h-screen flex flex-col">
      <div className="flex items-between justify-between w-full">
            <div className="dark:invert">
            <LogoIcon />
            </div>
            <UserComponent />
        </div>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}