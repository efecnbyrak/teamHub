"use client";
import { useEffect, useState } from "react";
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
  createdAt: string;
  deadline?: string;
  project: { id: string; name: string };
  assignee?: { id: string; firstName: string; lastName: string } | null;
  creator: { id: string; firstName: string; lastName: string };
}

const priorityLabel = { low: "Düşük", medium: "Orta", high: "Yüksek" } as Record<string, string>;
const statusLabel = { todo: "Yapılacak", doing: "Yapılıyor", done: "Tamamlandı" } as Record<string, string>;
const priorityColor = { low: "bg-green-100 text-green-700", medium: "bg-yellow-100 text-yellow-700", high: "bg-red-100 text-red-700" } as Record<string, string>;
const statusColor = { todo: "bg-muted text-muted-foreground", doing: "bg-blue-100 text-blue-700", done: "bg-green-100 text-green-700" } as Record<string, string>;

export default function SuperTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/super/tasks").then(({ data }) => setTasks(data.tasks)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Görevler</h1>
        <p className="text-muted-foreground">Sistemdeki tüm görevler</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Görev Listesi ({tasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Yükleniyor...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4">Görev</th>
                    <th className="text-left py-2 pr-4">Proje</th>
                    <th className="text-left py-2 pr-4">Atanan</th>
                    <th className="text-left py-2 pr-4">Durum</th>
                    <th className="text-left py-2 pr-4">Öncelik</th>
                    <th className="text-left py-2 pr-4">XP</th>
                    <th className="text-left py-2">Son Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3 pr-4 font-medium max-w-[200px] truncate">{t.title}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{t.project.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[t.status]}`}>
                          {statusLabel[t.status] ?? t.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[t.priority]}`}>
                          {priorityLabel[t.priority] ?? t.priority}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{t.xpReward} XP</td>
                      <td className="py-3 text-muted-foreground">
                        {t.deadline ? format(new Date(t.deadline), "d MMM yyyy", { locale: tr }) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
