"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Trophy, LogOut, FolderKanban,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  ClipboardList, BarChart2, Eye, Users, Shield, Home,
  Bell, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { clearTokens } from "@/lib/api";

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2500];

function xpProgress(xp: number, level: number): number {
  const current = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const next = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]!;
  if (next === current) return 100;
  return Math.round(((xp - current) / (next - current)) * 100);
}

interface Project { id: string; name: string; }

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    api.get("/projects").then(({ data }) => {
      setProjects((data.projects ?? data).slice(0, 8));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    api.get("/notifications").then(({ data }) => setUnreadCount(data.unreadCount ?? 0)).catch(() => {});
  }, []);

  function handleLogout() {
    logout();
    clearTokens();
    router.push("/login");
  }

  function NavItem({
    href, label, icon: Icon, exact = false,
  }: { href: string; label: string; icon: React.ElementType; exact?: boolean }) {
    const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        title={collapsed ? label : undefined}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          collapsed && "justify-center px-2"
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  }

  function SectionHeader({ label }: { label: string }) {
    if (collapsed) return null;
    return (
      <p className="px-3 pt-3 pb-1 text-[11px] font-bold text-foreground/60 uppercase tracking-[0.08em]">
        {label}
      </p>
    );
  }

  const displayName = user ? `${user.firstName} ${user.lastName}` : "";
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "?";

  return (
    <>
      <aside
        className={cn(
          "border-r bg-card flex flex-col h-screen sticky top-0 transition-all duration-200",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className={cn("flex items-center border-b p-4", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && <h1 className="text-lg font-bold text-primary">TeamHub</h1>}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <SectionHeader label="Main Menu" />

          <NavItem href="/dashboard" label="Home" icon={Home} exact />
          <NavItem href="/my-work" label="Your Work" icon={ClipboardList} />

          {/* Projects accordion */}
          <div>
            <button
              onClick={() => !collapsed && setProjectsOpen((o) => !o)}
              title={collapsed ? "Projects" : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground",
                (pathname === "/projects" || pathname.startsWith("/projects/")) && "bg-primary text-primary-foreground hover:bg-primary",
                collapsed && "justify-center px-2"
              )}
            >
              <FolderKanban className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left truncate">Projects</span>
                  {projectsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </>
              )}
            </button>

            {!collapsed && projectsOpen && (
              <div className="ml-4 mt-1 space-y-0.5 border-l pl-3">
                <Link
                  href="/projects"
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
                    pathname === "/projects"
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  All Projects
                </Link>
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors truncate",
                      pathname === `/projects/${p.id}`
                        ? "text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {p.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <NavItem href="/calendar" label="Takvim" icon={Calendar} />
          <NavItem href="/analytics" label="Analytics" icon={BarChart2} />
          <NavItem href="/views" label="Views" icon={Eye} />
          <NavItem href="/leaderboard" label="Leaderboard" icon={Trophy} />

          {/* Bildirimler */}
          <Link
            href="/notifications"
            title={collapsed ? "Bildirimler" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors relative",
              pathname === "/notifications" || pathname.startsWith("/notifications/")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              collapsed && "justify-center px-2"
            )}
          >
            <div className="relative shrink-0">
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            {!collapsed && <span className="truncate">Bildirimler</span>}
          </Link>

          {/* Team */}
          <SectionHeader label="Team" />
          <NavItem href="/teams" label="Teams" icon={Users} />

          {/* Super Admin */}
          {user?.role === "super_admin" && (
            <>
              <SectionHeader label="Management" />
              <NavItem href="/super" label="Super Panel" icon={Shield} />
            </>
          )}
        </nav>

        {/* User section */}
        {user && (
          <div className={cn("p-3 border-t space-y-2", collapsed && "p-2")}>
            <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground">Level {user.level}</p>
                </div>
              )}
            </div>
            {!collapsed && (
              <div className="space-y-1">
                <Progress value={xpProgress(user.xp, user.level)} className="h-1.5" />
                <p className="text-xs text-muted-foreground text-right">{user.xp} XP</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-600 border-0",
                collapsed && "justify-center px-0"
              )}
              onClick={() => setLogoutDialogOpen(true)}
              title={collapsed ? "Sign Out" : undefined}
            >
              <LogOut className="h-[18px] w-[18px]" />
              {!collapsed && "Sign Out"}
            </Button>
          </div>
        )}
      </aside>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Çıkış yapmak istiyor musunuz?</AlertDialogTitle>
            <AlertDialogDescription>
              Hesabınızdan çıkış yapılacak.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Eminim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
