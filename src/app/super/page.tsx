"use client";
import { useEffect, useState } from "react";
import { Users, FolderKanban, ClipboardList, UsersRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Stats {
  userCount: number;
  projectCount: number;
  taskCount: number;
  teamCount: number;
  recentUsers: { id: string; firstName: string; lastName: string; email: string; gorev?: string; role: string; createdAt: string }[];
}

export default function SuperDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get("/super/stats").then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  const statCards = stats ? [
    { label: "Toplam Kullanıcı", value: stats.userCount, icon: Users, color: "text-blue-500" },
    { label: "Toplam Proje", value: stats.projectCount, icon: FolderKanban, color: "text-green-500" },
    { label: "Toplam Görev", value: stats.taskCount, icon: ClipboardList, color: "text-orange-500" },
    { label: "Toplam Takım", value: stats.teamCount, icon: UsersRound, color: "text-purple-500" },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Süper Admin Paneli</h1>
        <p className="text-muted-foreground">Sistemin genel durumu</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Son Kayıt Olan Kullanıcılar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-muted-foreground">{u.email} {u.gorev && `· ${u.gorev}`}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "super_admin" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                    {u.role === "super_admin" ? "Süper Admin" : "Kullanıcı"}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(u.createdAt), "d MMM yyyy", { locale: tr })}
                  </p>
                </div>
              </div>
            ))}
            {!stats && <p className="text-muted-foreground text-sm">Yükleniyor...</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
