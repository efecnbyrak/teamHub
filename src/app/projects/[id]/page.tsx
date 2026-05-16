"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Plus, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

interface Member { user: { id: string; firstName: string; lastName: string; avatar?: string } }
interface Task {
  id: string; title: string; description?: string;
  status: string; priority: string; xpReward: number;
  assignee?: { id: string; firstName: string; lastName: string } | null;
}
interface Project { id: string; name: string; description?: string; members: Member[]; tasks: Task[] }

const COLUMNS = [
  { key: "todo", label: "Yapılacak" },
  { key: "doing", label: "Yapılıyor" },
  { key: "done", label: "Tamamlandı" },
];

const priorityLabels: Record<string, string> = { low: "Kolay", medium: "Orta", high: "Zor" };
const priorityVariants: Record<string, "secondary" | "default" | "destructive"> = {
  low: "secondary", medium: "default", high: "destructive",
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const [project, setProject] = useState<Project | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", assignedTo: "", deadline: "" });
  const [loading, setLoading] = useState(false);

  const fetchProject = useCallback(() => {
    api.get(`/projects/${id}`).then(({ data }) => setProject(data.project));
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);


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

  if (!project) return <div className="text-muted-foreground p-8">Yükleniyor...</div>;

  const tasksByStatus = COLUMNS.reduce<Record<string, Task[]>>((acc, col) => {
    acc[col.key] = project.tasks.filter((t) => t.status === col.key);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && <p className="text-muted-foreground mt-1">{project.description}</p>}
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-2" />Görev Ekle</Button>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger className="hidden" />
          <DialogContent>
            <DialogHeader><DialogTitle>Yeni Görev</DialogTitle></DialogHeader>
            <form onSubmit={createTask} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Başlık</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required placeholder="Görev başlığı" />
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="İsteğe bağlı..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Zorluk</Label>
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
                  <Label>Deadline</Label>
                  <Input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Atanacak kişi</Label>
                <Select value={form.assignedTo} onValueChange={(v) => setForm((f) => ({ ...f, assignedTo: v ?? "" }))}>
                  <SelectTrigger><SelectValue placeholder="Seç (isteğe bağlı)" /></SelectTrigger>
                  <SelectContent>
                    {project.members.map((m) => (
                      <SelectItem key={m.user.id} value={m.user.id}>{m.user.firstName} {m.user.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Ekleniyor..." : "Ekle"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.key} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{col.label}</h2>
              <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                {tasksByStatus[col.key]?.length ?? 0}
              </span>
            </div>
            <div className="space-y-2 min-h-24">
              {(tasksByStatus[col.key] ?? []).map((task) => (
                <Card key={task.id} className="cursor-default shadow-sm">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <p className="text-sm font-medium leading-snug">{task.title}</p>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={priorityVariants[task.priority]} className="text-xs">
                        {priorityLabels[task.priority]}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">+{task.xpReward} XP</span>
                    </div>
                    {task.assignee && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />{task.assignee.firstName} {task.assignee.lastName}
                      </div>
                    )}
                    <div className="flex gap-1 flex-wrap">
                      {COLUMNS.filter((c) => c.key !== col.key).map((c) => (
                        <Button
                          key={c.key}
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={() => moveTask(task.id, c.key)}
                        >
                          → {c.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
