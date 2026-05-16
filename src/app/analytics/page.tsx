"use client";
import { useEffect, useState } from "react";
import { BarChart2, CheckCircle, Zap, FolderKanban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

interface AnalyticsData {
  totalAssigned: number;
  completedTasks: number;
  totalXpEarned: number;
  projectCount: number;
  recentXp: { reason: string; amount: number; createdAt: string }[];
}

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2500];
function xpProgress(xp: number, level: number): number {
  const current = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const next = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]!;
  if (next === current) return 100;
  return Math.round(((xp - current) / (next - current)) * 100);
}

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    Promise.all([
      api.get("/tasks/assigned"),
      api.get("/projects"),
      api.get("/xp/history"),
    ]).then(([tasksRes, projectsRes, xpRes]) => {
      const tasks = tasksRes.data.tasks ?? [];
      const projects = projectsRes.data.projects ?? projectsRes.data ?? [];
      const xpHistory = xpRes.data.transactions ?? [];
      setData({
        totalAssigned: tasks.length,
        completedTasks: tasks.filter((t: { status: string }) => t.status === "done").length,
        totalXpEarned: xpHistory.reduce((sum: number, t: { amount: number }) => sum + t.amount, 0),
        projectCount: projects.length,
        recentXp: xpHistory.slice(0, 8),
      });
    }).catch(() => {});
  }, []);

  const statCards = user && data ? [
    { label: "Toplam Atanan Görev", value: data.totalAssigned, icon: BarChart2, color: "text-blue-500" },
    { label: "Tamamlanan Görev", value: data.completedTasks, icon: CheckCircle, color: "text-green-500" },
    { label: "Kazanılan XP", value: data.totalXpEarned, icon: Zap, color: "text-amber-500" },
    { label: "Proje Sayısı", value: data.projectCount, icon: FolderKanban, color: "text-purple-500" },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Performansın ve istatistiklerin</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-5 w-5 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Seviye İlerlemesi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Seviye {user.level}</span>
              <span className="text-muted-foreground">{user.xp} XP</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${xpProgress(user.xp, user.level)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Bir sonraki seviye için {LEVEL_THRESHOLDS[user.level] ? LEVEL_THRESHOLDS[user.level]! - user.xp : 0} XP gerekiyor
            </p>
          </CardContent>
        </Card>
      )}

      {data?.recentXp && data.recentXp.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Son XP Kazanımları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentXp.map((entry, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm">
                  <span className="text-muted-foreground">{entry.reason}</span>
                  <span className="font-medium text-amber-600">+{entry.amount} XP</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
