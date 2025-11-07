"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Settings, Webhook, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: FileText,
  },
  {
    href: "/dashboard/pages/new",
    label: "New Page",
    icon: PlusCircle,
  },
  {
    href: "/dashboard/webhooks",
    label: "Webhooks",
    icon: Webhook,
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      {/* Safe area spacer for iOS notch */}
      <div className="h-[env(safe-area-inset-bottom)]" />

      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href === "/dashboard" && pathname === "/dashboard");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-lg px-4 py-2 text-xs font-medium transition-colors min-w-[64px] min-h-[56px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:bg-secondary"
              )}
            >
              <Icon className={cn("h-6 w-6", isActive && "fill-primary/20")} />
              <span className="truncate max-w-[64px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
