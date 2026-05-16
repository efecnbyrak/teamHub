"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  creator: { id: string; firstName: string; lastName: string };
  _count: { members: number; projects: number };
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.get("/teams").then(({ data }) => setTeams(data.teams)).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post("/teams", form);
      setTeams((prev) => [data.team, ...prev]);
      setShowModal(false);
      setForm({ name: "", description: "" });
      toast.success("Takım oluşturuldu");
    } catch {
      toast.error("Takım oluşturulamadı");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Takımlar</h1>
          <p className="text-muted-foreground">Takımlarını yönet ve yeni takım oluştur</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> Yeni Takım
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Yükleniyor...</p>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">Henüz takımın yok</h3>
            <p className="text-muted-foreground text-sm mb-4">İlk takımını oluştur ve arkadaşlarını davet et.</p>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4 mr-2" /> Takım Oluştur
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-base">{team.name}</CardTitle>
                  {team.description && <p className="text-sm text-muted-foreground">{team.description}</p>}
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {team._count.members} üye</span>
                    <span className="flex items-center gap-1"><FolderKanban className="h-4 w-4" /> {team._count.projects} proje</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Kurucu: {team.creator.firstName} {team.creator.lastName}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Yeni Takım Oluştur</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Takım Adı</Label>
                  <Input
                    placeholder="Örn: Frontend Ekibi"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Açıklama (isteğe bağlı)</Label>
                  <Input
                    placeholder="Takım hakkında kısa bir açıklama"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={creating} className="flex-1">
                    {creating ? "Oluşturuluyor..." : "Oluştur"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>İptal</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
