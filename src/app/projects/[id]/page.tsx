"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, User, ArrowRight, ExternalLink, Users, CheckSquare, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface Member {
  role: string;
  user: { id: string; firstName: string; lastName: string; avatar?: string };
}
interface Task {
  id: string; title: string; description?: string;
  status: string; priority: string; xpReward: number;
  deadline?: string | null;
  assignee?: { id: string; firstName: string; lastName: string } | null;
}
interface Project {
  id: string; name: string; description?: string;
  members: Member[];
  tasks: Task[];
}

const COLUMNS: { key: string; label: string; color: string; emptyText: string }[] = [
  { key: "todo",        label: "Yapılacak",   color: "bg-slate-50 border-slate-200",   emptyText: "Henüz görev yok" },
  { key: "in_progress", label: "Yapılıyor",   color: "bg-amber-50 border-amber-200",   emptyText: "Aktif görev yok" },
  { key: "done",        label: "Tamamlandı",  color: "bg-emerald-50 border-emerald-200", emptyText: "Tamamlanan yok" },
];

const priorityLabels: Record<string, string> = { low: "Kolay", medium: "Orta", high: "Zor" };
const priorityVariants: Record<string, "secondary" | "default" | "destructive"> = {
  low: "secondary", medium: "default", high: "destructive",
};
const moveLabels: Record<string, string> = {
  todo: "Yapılacak",
  in_progress: "Yapılıyor",
  done: "Tamamlandı",
};

function isOverdue(deadline?: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

function formatDeadline(deadline: string): string {
  return new Date(deadline).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const [project, setProject] = useState<Project | null>(null);
  const [myRole, setMyRole] = useState<"owner" | "admin" | "member">("member");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", assignedTo: "", deadline: "" });
  const [loading, setLoading] = useState(false);

  const fetchProject = useCallback(() => {
    api.get(`/projects/${id}`).then(({ data }) => {
      setProject(data.project);
      setMyRole(data.myRole ?? "member");
    });
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const canManageTasks = myRole === "owner" || myRole === "admin";

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/tasks/project/${id}`, {
        ...form,
        assignedTo: form.assignedTo || undefined,
        deadline: form.deadline || undefined,
      });
      setForm({ title: "", description: "", priority: "medium", assignedTo: "", deadline: "" });
      setAddOpen(false);
      fetchProject();
      toast.success("Görev eklendi!");
    } catch {
      toast.error("Görev eklenemedi");
    } finally {
      setLoading(false);
    }
  }

  async function moveTask(taskId: string, newStatus: string) {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchProject();
      if (newStatus === "done") toast.success("Görev tamamlandı! XP kazandın 🎉");
    } catch {
      toast.error("Durum güncellenemedi");
    }
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Yükleniyor...
      </div>
    );
  }

  const tasksByStatus = COLUMNS.reduce<Record<string, Task[]>>((acc, col) => {
    acc[col.key] = project.tasks.filter((t) => t.status === col.key);
    return acc;
  }, {});

  const totalTasks = project.tasks.length;
  const doneTasks = project.tasks.filter((t) => t.status === "done").length;

  return (
    <div className="space-y-6">
      {/* ─── Sayfa Başlığı ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold truncate">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-1 text-sm">{project.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {project.members.length} üye
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckSquare className="h-4 w-4" />
              {doneTasks}/{totalTasks} görev tamamlandı
            </span>
            {totalTasks > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.round((doneTasks / totalTasks) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.round((doneTasks / totalTasks) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
        {canManageTasks && (
          <Button onClick={() => setAddOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Görev Ekle
          </Button>
        )}
      </div>

      {/* ─── Kanban Board ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const tasks = tasksByStatus[col.key] ?? [];
          return (
            <div key={col.key} className={cn("rounded-xl border p-3 space-y-3", col.color)}>
              {/* Kolon Başlığı */}
              <div className="flex items-center justify-between px-1">
                <h2 className="font-semibold text-sm">{col.label}</h2>
                <span className="text-xs bg-white/70 text-foreground/70 border rounded-full px-2 py-0.5 font-medium">
                  {tasks.length}
                </span>
              </div>

              {/* Görev Kartları */}
              <div className="space-y-2 min-h-[80px]">
                {tasks.length === 0 && (
                  <div className="flex items-center justify-center h-16 text-xs text-muted-foreground italic">
                    {col.emptyText}
                  </div>
                )}
                {tasks.map((task) => {
                  const overdue = isOverdue(task.deadline);
                  return (
                    <Card key={task.id} className="bg-white shadow-sm border-border/60 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-1.5 pt-3 px-3">
                        <p className="text-sm font-semibold leading-snug">{task.title}</p>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 space-y-2">
                        {/* Öncelik + XP */}
                        <div className="flex items-center justify-between">
                          <Badge variant={priorityVariants[task.priority]} className="text-xs">
                            {priorityLabels[task.priority]}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-medium">+{task.xpReward} XP</span>
                        </div>

                        {/* Atanan kişi */}
                        {task.assignee && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User className="h-3 w-3 shrink-0" />
                            <span className="truncate">{task.assignee.firstName} {task.assignee.lastName}</span>
                          </div>
                        )}

                        {/* Deadline */}
                        {task.deadline && (
                          <div className={cn(
                            "flex items-center gap-1.5 text-xs",
                            overdue ? "text-destructive font-medium" : "text-muted-foreground"
                          )}>
                            <Clock className="h-3 w-3 shrink-0" />
                            {overdue ? "Gecikti · " : ""}{formatDeadline(task.deadline)}
                          </div>
                        )}

                        {/* Eylemler */}
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          {COLUMNS.filter((c) => c.key !== col.key).map((c) => (
                            <Button
                              key={c.key}
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs px-2 bg-white"
                              onClick={() => moveTask(task.id, c.key)}
                            >
                              <ArrowRight className="h-3 w-3 mr-1" />
                              {moveLabels[c.key]}
                            </Button>
                          ))}
                          <Link
                            href={`/projects/${id}/tasks/${task.id}`}
                            className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Detay
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Görev Ekleme Modalı ────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Görev Ekle</DialogTitle>
          </DialogHeader>
          <form onSubmit={createTask} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Başlık <span className="text-destructive">*</span></Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
                placeholder="Görev başlığı girin"
              />
            </div>
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="İsteğe bağlı açıklama..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Zorluk / XP</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v ?? "medium" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Kolay (+10 XP)</SelectItem>
                    <SelectItem value="medium">Orta (+25 XP)</SelectItem>
                    <SelectItem value="high">Zor (+50 XP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Son Tarih</Label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Atanacak Kişi</Label>
              <Select value={form.assignedTo} onValueChange={(v) => setForm((f) => ({ ...f, assignedTo: v ?? "" }))}>
                <SelectTrigger>
                  <span className="flex flex-1 text-left text-sm">
                    {form.assignedTo
                      ? (() => {
                          const m = project.members.find((mb) => mb.user.id === form.assignedTo);
                          return m ? `${m.user.firstName} ${m.user.lastName}` : "Seç";
                        })()
                      : <span className="text-muted-foreground">Seç (isteğe bağlı)</span>
                    }
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {project.members.map((m) => (
                    <SelectItem key={m.user.id} value={m.user.id}>
                      {m.user.firstName} {m.user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Ekleniyor..." : "Görevi Ekle"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
