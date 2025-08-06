import Link from "next/link";
import { Heart, Home, Camera, BookOpen, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Photos & Videos", href: "/photos", icon: Camera },
  { name: "Guestbook", href: "/guestbook", icon: BookOpen },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  return (
    <div
      className={cn(
        "flex h-screen w-64 flex-col bg-card border-r border-border",
        className
      )}
    >
      {/* Header with logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Heart className="size-5" />
        </div>
        <span className="text-lg font-semibold text-foreground">
          THE LOVE LENS
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    "text-foreground hover:bg-secondary hover:text-foreground"
                    // You can add active state logic here
                    // "bg-secondary text-foreground" for active state
                  )}
                >
                  <Icon className="size-4" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
