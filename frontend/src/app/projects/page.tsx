"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users, ListChecks, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";

interface Project {
  id: string;
  name: string;
  description?: string;
  role: string;
  _count: { tasks: number; members: number };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteProjectId, setInviteProjectId] = useState<string | null>(null);

  useEffect(() => {
    api.get("/projects").then(({ data }) => setProjects(data.projects));
  }, []);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/projects", form);
      setProjects((prev) => [{ ...data.project, role: "owner", _count: { tasks: 0, members: 1 } }, ...prev]);
      setForm({ name: "", description: "" });
      setOpen(false);
      toast.success("Proje oluşturuldu!");
    } catch {
      toast.error("Proje oluşturulamadı");
    } finally {
      setLoading(false);
    }
  }

  async function getInviteLink(projectId: string) {
    try {
      const { data } = await api.get(`/projects/${projectId}/invite`);
      setInviteLink(data.inviteLink);
      setInviteProjectId(projectId);
    } catch {
      toast.error("Davet linki alınamadı");
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projeler</h1>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Yeni Proje</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="hidden" />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Proje Oluştur</DialogTitle>
            </DialogHeader>
            <form onSubmit={createProject} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Proje Adı</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="TeamHub v2" />
              </div>
              <div className="space-y-2">
                <Label>Açıklama (isteğe bağlı)</Label>
                <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Bu proje hakkında..." rows={3} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Oluşturuluyor..." : "Oluştur"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">Henüz projen yok.</p>
          <p className="text-sm mt-1">İlk projeyi oluştur veya bir davet linki ile katıl.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {projects.map((p) => (
          <Card key={p.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <Link href={`/projects/${p.id}`}>
                  <CardTitle className="text-base hover:text-primary transition-colors cursor-pointer">{p.name}</CardTitle>
                </Link>
                {p.role === "owner" && (
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => getInviteLink(p.id)}>
                    <Users className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><ListChecks className="h-3.5 w-3.5" />{p._count.tasks} görev</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{p._count.members} üye</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {inviteLink && inviteProjectId && (
        <Dialog open={!!inviteLink} onOpenChange={() => setInviteLink(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Davet Linki</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Bu linki arkadaşlarınla paylaş:</p>
            <div className="flex gap-2">
              <Input readOnly value={inviteLink} className="font-mono text-xs" />
              <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success("Kopyalandı!"); }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
