"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, CheckCircle, Clock, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  xpReward: number;
  project: { id: string; name: string };
}

interface Project {
  id: string;
  name: string;
  description?: string;
  _count: { tasks: number; members: number };
}

const priorityColor: Record<string, string> = {
  low: "secondary",
  medium: "default",
  high: "destructive",
};

const statusIcon = (s: string) => {
  if (s === "done") return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (s === "doing") return <Clock className="h-4 w-4 text-yellow-500" />;
  return <Circle className="h-4 w-4 text-muted-foreground" />;
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    api.get("/projects").then(({ data }) => setProjects(data.projects.slice(0, 5)));
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all(
      projects.map((p) =>
        api.get(`/tasks/project/${p.id}`, { params: { assignedTo: user.id } })
          .then(({ data }) =>
            (data.tasks as Task[]).map((t: Task) => ({ ...t, project: { id: p.id, name: p.name } }))
          )
      )
    ).then((results) => {
      const all = results.flat().filter((t) => t.status !== "done").slice(0, 8);
      setMyTasks(all);
    });
  }, [projects, user]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Merhaba, {user?.name?.split(" ")[0]} 👋</h1>
        <p className="text-muted-foreground mt-1">İşte bugün seni bekleyenler.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold">{user?.xp ?? 0}</p>
            <p className="text-sm text-muted-foreground">Toplam XP</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold">Lv. {user?.level ?? 1}</p>
            <p className="text-sm text-muted-foreground">Seviye</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold">{myTasks.length}</p>
            <p className="text-sm text-muted-foreground">Açık görev</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Benim Görevlerim</CardTitle>
            <Link href="/projects">
              <Button size="sm" variant="ghost">Tümü</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {myTasks.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Sana atanmış görev yok 🎉
              </p>
            )}
            {myTasks.map((task) => (
              <Link key={task.id} href={`/projects/${task.project.id}`}>
                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors cursor-pointer">
                  {statusIcon(task.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.project.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={priorityColor[task.priority] as "default" | "secondary" | "destructive"} className="text-xs">
                      {task.priority === "high" ? "Zor" : task.priority === "low" ? "Kolay" : "Orta"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">+{task.xpReward}XP</span>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Projelerim</CardTitle>
            <Link href="/projects">
              <Button size="sm" variant="ghost">
                <Plus className="h-4 w-4 mr-1" />Yeni
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {projects.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Henüz projen yok. Bir tane oluştur!
              </p>
            )}
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <div className="p-3 rounded-md hover:bg-muted transition-colors cursor-pointer border">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {p._count.tasks} görev · {p._count.members} üye
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
