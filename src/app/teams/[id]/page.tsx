"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import { UserPlus, Trash2, Link2, Unlink, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

type TeamRole = "owner" | "admin" | "member";

interface TeamMember {
  role: TeamRole;
  joinedAt: string;
  user: { id: string; firstName: string; lastName: string; email: string; gorev?: string; xp: number; level: number };
}

interface LinkedProject {
  project: { id: string; name: string; description?: string };
}

interface Team {
  id: string;
  name: string;
  description?: string;
  creator: { id: string; firstName: string; lastName: string; email: string };
  members: TeamMember[];
  projects: LinkedProject[];
}

interface MyProject {
  id: string;
  name: string;
}

const ROLE_LABELS: Record<TeamRole, string> = {
  owner: "Kurucu",
  admin: "Yönetici",
  member: "Üye",
};

const ROLE_COLORS: Record<TeamRole, string> = {
  owner: "bg-amber-100 text-amber-700",
  admin: "bg-blue-100 text-blue-700",
  member: "bg-muted text-muted-foreground",
};

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: teamId } = use(params);
  const { user: me } = useAuthStore();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  // Invite queue
  const [inviteInput, setInviteInput] = useState("");
  const [inviteQueue, setInviteQueue] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);

  // Project linking
  const [myProjects, setMyProjects] = useState<MyProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [linking, setLinking] = useState(false);

  const myRole = team?.members.find((m) => m.user.id === me?.id)?.role ?? null;
  const canManageMembers = myRole === "owner" || myRole === "admin" || myRole === "member";
  const canManageProjects = myRole === "owner" || myRole === "admin";
  const canChangeRoles = myRole === "owner" || myRole === "admin";

  useEffect(() => {
    api.get(`/teams/${teamId}`).then(({ data }) => setTeam(data.team)).finally(() => setLoading(false));
    api.get("/projects").then(({ data }) => setMyProjects(data.projects ?? data)).catch(() => {});
  }, [teamId]);

  function refreshTeam() {
    return api.get(`/teams/${teamId}`).then(({ data }) => setTeam(data.team));
  }

  // --- Invite queue logic ---
  function addToQueue() {
    const email = inviteInput.trim().toLowerCase();
    if (!email) return;
    if (inviteQueue.includes(email)) {
      toast.error("Bu e-posta zaten listede");
      return;
    }
    if (team?.members.some((m) => m.user.email.toLowerCase() === email)) {
      toast.error("Bu kullanıcı zaten takımda");
      return;
    }
    setInviteQueue((q) => [...q, email]);
    setInviteInput("");
  }

  function removeFromQueue(email: string) {
    setInviteQueue((q) => q.filter((e) => e !== email));
  }

  async function inviteAll() {
    if (inviteQueue.length === 0) return;
    setInviting(true);
    const errors: string[] = [];
    for (const email of inviteQueue) {
      try {
        await api.post(`/teams/${teamId}/members`, { email });
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        errors.push(`${email}: ${msg ?? "hata"}`);
      }
    }
    if (errors.length > 0) {
      toast.error(`${errors.length} üye eklenemedi`, { description: errors.join(", ") });
    } else {
      toast.success(`${inviteQueue.length} üye başarıyla eklendi`);
    }
    setInviteQueue([]);
    await refreshTeam();
    setInviting(false);
  }

  // --- Role change ---
  async function handleRoleChange(targetUserId: string, newRole: string) {
    try {
      await api.put(`/teams/${teamId}/members`, { userId: targetUserId, role: newRole });
      toast.success("Rol güncellendi");
      await refreshTeam();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || "Rol güncellenemedi");
    }
  }

  // --- Remove member ---
  async function handleRemove(targetUserId: string) {
    try {
      await api.delete(`/teams/${teamId}/members?userId=${targetUserId}`);
      setTeam((prev) => prev ? { ...prev, members: prev.members.filter((m) => m.user.id !== targetUserId) } : null);
      toast.success("Üye çıkarıldı");
    } catch {
      toast.error("İşlem başarısız");
    }
  }

  // --- Link project ---
  async function handleLinkProject() {
    if (!selectedProjectId) return;
    setLinking(true);
    try {
      await api.post(`/teams/${teamId}/projects`, { projectId: selectedProjectId });
      toast.success("Proje bağlandı");
      setSelectedProjectId("");
      await refreshTeam();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || "Proje bağlanamadı");
    } finally {
      setLinking(false);
    }
  }

  // --- Unlink project ---
  async function handleUnlinkProject(projectId: string) {
    try {
      await api.delete(`/teams/${teamId}/projects/${projectId}`);
      toast.success("Proje bağlantısı kaldırıldı");
      await refreshTeam();
    } catch {
      toast.error("İşlem başarısız");
    }
  }

  // Linked project IDs for filtering available projects
  const linkedProjectIds = new Set(team?.projects.map((p) => p.project.id) ?? []);
  const availableProjects = myProjects.filter((p) => !linkedProjectIds.has(p.id));

  if (loading) return <p className="p-6 text-muted-foreground">Yükleniyor...</p>;
  if (!team) return <p className="p-6 text-muted-foreground">Takım bulunamadı.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{team.name}</h1>
        {team.description && <p className="text-muted-foreground mt-1">{team.description}</p>}
        {myRole && (
          <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[myRole]}`}>
            Rolünüz: {ROLE_LABELS[myRole]}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Üyeler ({team.members.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {team.members.map((m) => {
                const isMe = m.user.id === me?.id;
                const canChangeThisRole =
                  canChangeRoles &&
                  !isMe &&
                  !(m.role === "owner" && myRole !== "owner"); // admin cannot touch owner

                return (
                  <div key={m.user.id} className="flex items-center justify-between py-2 border-b last:border-0 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {m.user.firstName[0]}{m.user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{m.user.firstName} {m.user.lastName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {m.user.email}{m.user.gorev && ` · ${m.user.gorev}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {canChangeThisRole ? (
                        <Select
                          value={m.role}
                          onValueChange={(val) => val && handleRoleChange(m.user.id, val)}
                        >
                          <SelectTrigger className="h-7 text-xs w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {myRole === "owner" && <SelectItem value="owner">Kurucu</SelectItem>}
                            <SelectItem value="admin">Yönetici</SelectItem>
                            <SelectItem value="member">Üye</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[m.role]}`}>
                          {ROLE_LABELS[m.role]}
                        </span>
                      )}

                      {(myRole === "owner" || myRole === "admin") && !isMe && m.role !== "owner" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive h-7 w-7 p-0"
                          onClick={() => handleRemove(m.user.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Invite section */}
          {canManageMembers && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> Üye Ekle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="E-posta adresi girin"
                    value={inviteInput}
                    onChange={(e) => setInviteInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addToQueue(); } }}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addToQueue}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {inviteQueue.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Eklenecekler ({inviteQueue.length}):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {inviteQueue.map((email) => (
                        <Badge key={email} variant="secondary" className="gap-1 text-xs">
                          {email}
                          <button onClick={() => removeFromQueue(email)} className="ml-0.5 hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      onClick={inviteAll}
                      disabled={inviting}
                      className="w-full mt-2"
                    >
                      {inviting ? "Ekleniyor..." : `Hepsini Ekle (${inviteQueue.length})`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Projects */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-4 w-4" /> Bağlı Projeler ({team.projects.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {team.projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz bağlı proje yok.</p>
              ) : (
                team.projects.map(({ project }) => (
                  <div key={project.id} className="flex items-center justify-between p-2 rounded-md bg-muted/40">
                    <span className="text-sm font-medium truncate">{project.name}</span>
                    {canManageProjects && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive h-7 w-7 p-0 ml-2 shrink-0"
                        onClick={() => handleUnlinkProject(project.id)}
                        title="Bağlantıyı kaldır"
                      >
                        <Unlink className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {canManageProjects && availableProjects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Projeye Bağla</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Select value={selectedProjectId} onValueChange={(v) => v && setSelectedProjectId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Proje seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleLinkProject}
                  disabled={!selectedProjectId || linking}
                >
                  {linking ? "Bağlanıyor..." : "Bağla"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Bağlandığında tüm takım üyeleri projeye otomatik eklenir.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
