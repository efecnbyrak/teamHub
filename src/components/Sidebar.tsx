"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Trophy, LogOut, FolderKanban,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  ClipboardList, BarChart2, Eye, Users, Shield, Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

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

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    api.get("/projects").then(({ data }) => {
      setProjects((data.projects ?? data).slice(0, 8));
    }).catch(() => {});
  }, []);

  function handleLogout() {
    logout();
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
      {/* Header */}
      <div className={cn("flex items-center border-b p-4", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && <h1 className="text-lg font-bold text-primary">TeamHub</h1>}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={collapsed ? "Genişlet" : "Daralt"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Ana Menü */}
        {!collapsed && <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ana Menü</p>}

        <NavItem href="/dashboard" label="Home" icon={Home} exact />
        <NavItem href="/my-work" label="Your Work" icon={ClipboardList} />

        {/* Projects with accordion */}
        <div>
          <button
            onClick={() => !collapsed && setProjectsOpen((o) => !o)}
            title={collapsed ? "Projeler" : undefined}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground",
              (pathname === "/projects" || pathname.startsWith("/projects/")) && "bg-primary text-primary-foreground hover:bg-primary",
              collapsed && "justify-center px-2"
            )}
          >
            <FolderKanban className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left truncate">Projects</span>
                {projectsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
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
                Tüm Projeler
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

        <NavItem href="/analytics" label="Analytics" icon={BarChart2} />
        <NavItem href="/views" label="Views" icon={Eye} />
        <NavItem href="/leaderboard" label="Leaderboard" icon={Trophy} />

        {/* Takım */}
        {!collapsed && <p className="px-3 py-1 mt-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Takım</p>}
        <NavItem href="/teams" label="Takımlar" icon={Users} />

        {/* Super Admin */}
        {user?.role === "super_admin" && (
          <>
            {!collapsed && <p className="px-3 py-1 mt-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Yönetim</p>}
            <NavItem href="/super" label="Süper Panel" icon={Shield} />
          </>
        )}
      </nav>

      {/* User section */}
      {user && (
        <div className={cn("p-3 border-t space-y-2", collapsed && "p-2")}>
          <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground">Seviye {user.level}</p>
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
            className={cn("w-full justify-start gap-2 text-muted-foreground", collapsed && "justify-center px-0")}
            onClick={handleLogout}
            title={collapsed ? "Çıkış Yap" : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && "Çıkış Yap"}
          </Button>
        </div>
      )}
    </aside>
  );
}
