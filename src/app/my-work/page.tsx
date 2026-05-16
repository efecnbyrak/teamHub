"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  xpReward: number;
  deadline?: string;
  project: { id: string; name: string };
}

const priorityLabel = { low: "Düşük", medium: "Orta", high: "Yüksek" } as Record<string, string>;
const statusLabel = { todo: "Yapılacak", doing: "Yapılıyor", done: "Tamamlandı" } as Record<string, string>;
const priorityColor = { low: "bg-green-100 text-green-700", medium: "bg-yellow-100 text-yellow-700", high: "bg-red-100 text-red-700" } as Record<string, string>;
const statusColor = { todo: "bg-muted text-muted-foreground", doing: "bg-blue-100 text-blue-700", done: "bg-green-100 text-green-700" } as Record<string, string>;

export default function MyWorkPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/tasks/assigned").then(({ data }) => setTasks(data.tasks ?? [])).finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your Work</h1>
        <p className="text-muted-foreground">Sana atanan tüm görevler</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "todo", "doing", "done"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            {s === "all" ? "Tümü" : statusLabel[s]}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Görevler ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Yükleniyor...</p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">Sana atanmış görev yok.</p>
            </div>
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
                      <span className="text-xs text-muted-foreground">{task.xpReward} XP</span>
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
