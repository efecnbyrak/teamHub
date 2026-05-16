"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import { UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

interface TeamMember {
  role: string;
  joinedAt: string;
  user: { id: string; firstName: string; lastName: string; email: string; gorev?: string; xp: number; level: number };
}

interface Team {
  id: string;
  name: string;
  description?: string;
  creator: { id: string; firstName: string; lastName: string; email: string };
  members: TeamMember[];
  projects: { project: { id: string; name: string; description?: string } }[];
}

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: teamId } = use(params);
  const { user: me } = useAuthStore();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const isOwner = team?.members.find((m) => m.user.id === me?.id)?.role === "owner";

  useEffect(() => {
    api.get(`/teams/${teamId}`).then(({ data }) => setTeam(data.team)).finally(() => setLoading(false));
  }, [teamId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await api.post(`/teams/${teamId}/members`, { email: inviteEmail.trim() });
      toast.success("Üye eklendi");
      setInviteEmail("");
      const { data } = await api.get(`/teams/${teamId}`);
      setTeam(data.team);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || "Üye eklenemedi");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(userId: string) {
    try {
      await api.delete(`/teams/${teamId}/members?userId=${userId}`);
      setTeam((prev) => prev ? { ...prev, members: prev.members.filter((m) => m.user.id !== userId) } : null);
      toast.success("Üye çıkarıldı");
    } catch {
      toast.error("İşlem başarısız");
    }
  }

  if (loading) return <p className="p-6 text-muted-foreground">Yükleniyor...</p>;
  if (!team) return <p className="p-6 text-muted-foreground">Takım bulunamadı.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{team.name}</h1>
        {team.description && <p className="text-muted-foreground">{team.description}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Üyeler */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Üyeler ({team.members.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {team.members.map((m) => (
                <div key={m.user.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {m.user.firstName[0]}{m.user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{m.user.firstName} {m.user.lastName}</p>
                      <p className="text-xs text-muted-foreground">{m.user.email} {m.user.gorev && `· ${m.user.gorev}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.role === "owner" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                      {m.role === "owner" ? "Kurucu" : "Üye"}
                    </span>
                    {isOwner && m.user.id !== me?.id && (
                      <Button size="sm" variant="ghost" className="text-destructive h-7 w-7 p-0" onClick={() => handleRemove(m.user.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Üye ekle */}
          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><UserPlus className="h-4 w-4" /> Üye Ekle</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInvite} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="E-posta adresi"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={inviting}>
                    {inviting ? "Ekleniyor..." : "Ekle"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Projeler */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Projeler ({team.projects.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {team.projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Bu takımla ilişkili proje yok.</p>
              ) : (
                team.projects.map(({ project }) => (
                  <div key={project.id} className="p-2 rounded-md bg-muted/40 text-sm font-medium">{project.name}</div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
