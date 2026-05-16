"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { format, isToday, isThisWeek } from "date-fns";
import { tr } from "date-fns/locale";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  xpReward: number;
  deadline?: string;
  assignedTo?: string;
  project: { id: string; name: string };
}

const VIEWS = [
  { key: "today", label: "Bugün" },
  { key: "week", label: "Bu Hafta" },
  { key: "high", label: "Yüksek Öncelikli" },
  { key: "mine", label: "Benim Görevlerim" },
  { key: "todo", label: "Yapılacaklar" },
] as const;

const priorityColor = { low: "bg-green-100 text-green-700", medium: "bg-yellow-100 text-yellow-700", high: "bg-red-100 text-red-700" } as Record<string, string>;
const statusColor = { todo: "bg-muted text-muted-foreground", doing: "bg-blue-100 text-blue-700", done: "bg-green-100 text-green-700" } as Record<string, string>;
const statusLabel = { todo: "Yapılacak", doing: "Yapılıyor", done: "Tamamlandı" } as Record<string, string>;
const priorityLabel = { low: "Düşük", medium: "Orta", high: "Yüksek" } as Record<string, string>;

export default function ViewsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [activeView, setActiveView] = useState<string>("mine");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/tasks/all-accessible"),
      api.get("/auth/me"),
    ]).then(([tasksRes, meRes]) => {
      setTasks(tasksRes.data.tasks ?? []);
      setUserId(meRes.data.user.id);
    }).finally(() => setLoading(false));
  }, []);

  function filterTasks(tasks: Task[]) {
    switch (activeView) {
      case "today": return tasks.filter((t) => t.deadline && isToday(new Date(t.deadline)));
      case "week": return tasks.filter((t) => t.deadline && isThisWeek(new Date(t.deadline), { weekStartsOn: 1 }));
      case "high": return tasks.filter((t) => t.priority === "high");
      case "mine": return tasks.filter((t) => t.assignedTo === userId);
      case "todo": return tasks.filter((t) => t.status === "todo");
      default: return tasks;
    }
  }

  const filtered = filterTasks(tasks);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Views</h1>
        <p className="text-muted-foreground">Görevleri farklı görünümlerde incele</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {VIEWS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveView(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeView === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {VIEWS.find((v) => v.key === activeView)?.label} ({filtered.length} görev)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Yükleniyor...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Bu görünümde görev bulunamadı.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((task) => (
                <Link key={task.id} href={`/projects/${task.project.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/40 transition-colors cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{task.project.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[task.status]}`}>
                        {statusLabel[task.status]}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[task.priority]}`}>
                        {priorityLabel[task.priority]}
                      </span>
                      {task.deadline && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(task.deadline), "d MMM", { locale: tr })}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
