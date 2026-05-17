"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckSquare, Square, Plus, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

interface Task {
  id: string; title: string; description?: string;
  status: string; priority: string; xpReward: number; deadline?: string;
  assignee?: { id: string; firstName: string; lastName: string } | null;
  creator?: { id: string; firstName: string; lastName: string };
}
interface Subtask { id: string; title: string; done: boolean; createdAt: string }
interface Comment {
  id: string; content: string; createdAt: string;
  author: { id: string; firstName: string; lastName: string; avatar?: string };
}

const statusLabels: Record<string, string> = { todo: "Yapılacak", doing: "Yapılıyor", done: "Tamamlandı" };
const priorityLabels: Record<string, string> = { low: "Kolay", medium: "Orta", high: "Zor" };
const priorityVariants: Record<string, "secondary" | "default" | "destructive"> = {
  low: "secondary", medium: "default", high: "destructive",
};

export default function TaskDetailPage() {
  const { id: projectId, taskId } = useParams<{ id: string; taskId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [task, setTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [loadingComment, setLoadingComment] = useState(false);

  const fetchTask = useCallback(async () => {
    const { data } = await api.get(`/tasks/${taskId}`);
    setTask(data.task);
  }, [taskId]);

  const fetchSubtasks = useCallback(async () => {
    const { data } = await api.get(`/tasks/${taskId}/subtasks`);
    setSubtasks(data.subtasks);
  }, [taskId]);

  const fetchComments = useCallback(async () => {
    const { data } = await api.get(`/tasks/${taskId}/comments`);
    setComments(data.comments);
  }, [taskId]);

  useEffect(() => {
    fetchTask();
    fetchSubtasks();
    fetchComments();
  }, [fetchTask, fetchSubtasks, fetchComments]);

  async function addSubtask(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    await api.post(`/tasks/${taskId}/subtasks`, { title: newSubtask.trim() });
    setNewSubtask("");
    fetchSubtasks();
  }

  async function toggleSubtask(id: string) {
    await api.put(`/subtasks/${id}`, {});
    fetchSubtasks();
  }

  async function deleteSubtask(id: string) {
    await api.delete(`/subtasks/${id}`);
    fetchSubtasks();
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoadingComment(true);
    try {
      await api.post(`/tasks/${taskId}/comments`, { content: newComment.trim() });
      setNewComment("");
      fetchComments();
      toast.success("Yorum eklendi");
    } catch {
      toast.error("Yorum eklenemedi");
    } finally {
      setLoadingComment(false);
    }
  }

  async function deleteComment(id: string) {
    await api.delete(`/comments/${id}`);
    fetchComments();
  }

  if (!task) return <div className="text-muted-foreground p-8">Yükleniyor...</div>;

  const doneCount = subtasks.filter((s) => s.done).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Geri
        </Button>
      </div>

      {/* Görev Bilgileri */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-xl font-bold">{task.title}</CardTitle>
            <div className="flex gap-2 shrink-0">
              <Badge variant={priorityVariants[task.priority]}>{priorityLabels[task.priority]}</Badge>
              <Badge variant="outline">{statusLabels[task.status]}</Badge>
            </div>
          </div>
          {task.description && <p className="text-muted-foreground text-sm mt-1">{task.description}</p>}
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">XP Ödülü:</span> <span className="font-medium">+{task.xpReward} XP</span></div>
          {task.assignee && (
            <div><span className="text-muted-foreground">Atanan:</span> <span className="font-medium">{task.assignee.firstName} {task.assignee.lastName}</span></div>
          )}
          {task.deadline && (
            <div><span className="text-muted-foreground">Deadline:</span> <span className="font-medium">{format(new Date(task.deadline), "d MMMM yyyy", { locale: tr })}</span></div>
          )}
          {task.creator && (
            <div><span className="text-muted-foreground">Oluşturan:</span> <span className="font-medium">{task.creator.firstName} {task.creator.lastName}</span></div>
          )}
        </CardContent>
      </Card>

      {/* Alt Görevler */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            Alt Görevler
            {subtasks.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">{doneCount}/{subtasks.length} tamamlandı</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {subtasks.length > 0 && (
            <div className="space-y-2">
              {subtasks.map((s) => (
                <div key={s.id} className="flex items-center gap-2 group">
                  <button onClick={() => toggleSubtask(s.id)} className="shrink-0 text-primary">
                    {s.done ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  <span className={`flex-1 text-sm ${s.done ? "line-through text-muted-foreground" : ""}`}>{s.title}</span>
                  <button onClick={() => deleteSubtask(s.id)} className="opacity-0 group-hover:opacity-100 text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={addSubtask} className="flex gap-2">
            <Input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="Yeni alt görev ekle..."
              className="h-8 text-sm"
            />
            <Button type="submit" size="sm" variant="outline" className="h-8 px-3">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Yorumlar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Yorumlar {comments.length > 0 && <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-3">Henüz yorum yok.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 group">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                {c.author.firstName[0]}{c.author.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{c.author.firstName} {c.author.lastName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{format(new Date(c.createdAt), "d MMM, HH:mm", { locale: tr })}</span>
                    {user?.id === c.author.id && (
                      <button onClick={() => deleteComment(c.id)} className="opacity-0 group-hover:opacity-100 text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{c.content}</p>
              </div>
            </div>
          ))}

          <form onSubmit={addComment} className="flex gap-2 items-end pt-2 border-t">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Bir yorum yaz..."
              rows={2}
              className="text-sm resize-none"
            />
            <Button type="submit" size="sm" disabled={loadingComment || !newComment.trim()} className="h-8 px-3 shrink-0">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
