"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, FolderKanban, UsersRound,
  ClipboardList, ChevronLeft, ChevronRight, LogOut, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/super", label: "Genel Bakış", icon: LayoutDashboard, exact: true },
  { href: "/super/users", label: "Kullanıcılar", icon: Users },
  { href: "/super/projects", label: "Projeler", icon: FolderKanban },
  { href: "/super/teams", label: "Takımlar", icon: UsersRound },
  { href: "/super/tasks", label: "Görevler", icon: ClipboardList },
];

export default function SuperSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("super-sidebar-collapsed") === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("super-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const displayName = user ? `${user.firstName} ${user.lastName}` : "";
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "?";

  return (
    <aside
      className={cn(
        "border-r bg-card flex flex-col h-screen sticky top-0 transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn("flex items-center border-b p-4", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold text-primary">TeamHub</h1>
            <p className="text-xs text-muted-foreground">Süper Admin</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={collapsed ? "Genişlet" : "Daralt"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn("p-3 border-t space-y-2", collapsed && "p-2")}>
        <Link
          href="/dashboard"
          title={collapsed ? "Dashboard'a Dön" : undefined}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
            collapsed && "justify-center px-2"
          )}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {!collapsed && "Dashboard'a Dön"}
        </Link>

        {user && (
          <>
            <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground">Süper Admin</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={cn("w-full justify-start gap-2 text-muted-foreground", collapsed && "justify-center px-0")}
              onClick={handleLogout}
              title={collapsed ? "Çıkış Yap" : undefined}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && "Çıkış Yap"}
            </Button>
          </>
        )}
      </div>
    </aside>
  );
}
