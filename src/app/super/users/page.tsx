"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gorev?: string;
  role: string;
  xp: number;
  level: number;
  createdAt: string;
}

export default function SuperUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/super/users").then(({ data }) => setUsers(data.users)).finally(() => setLoading(false));
  }, []);

  async function toggleRole(user: User) {
    const newRole = user.role === "super_admin" ? "user" : "super_admin";
    try {
      await api.patch(`/super/users/${user.id}`, { role: newRole });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: newRole } : u));
      toast.success("Rol güncellendi");
    } catch {
      toast.error("Güncelleme başarısız");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kullanıcılar</h1>
        <p className="text-muted-foreground">Tüm kayıtlı kullanıcılar</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Listesi ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Yükleniyor...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4">Ad Soyad</th>
                    <th className="text-left py-2 pr-4">E-posta</th>
                    <th className="text-left py-2 pr-4">Görev</th>
                    <th className="text-left py-2 pr-4">Rol</th>
                    <th className="text-left py-2 pr-4">XP / Seviye</th>
                    <th className="text-left py-2 pr-4">Kayıt Tarihi</th>
                    <th className="text-left py-2">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3 pr-4 font-medium">{u.firstName} {u.lastName}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{u.email}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{u.gorev ?? "—"}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "super_admin" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                          {u.role === "super_admin" ? "Süper Admin" : "Kullanıcı"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{u.xp} XP · Lv.{u.level}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{format(new Date(u.createdAt), "d MMM yyyy", { locale: tr })}</td>
                      <td className="py-3">
                        <Button size="sm" variant="outline" onClick={() => toggleRole(u)}>
                          {u.role === "super_admin" ? "Kullanıcı Yap" : "Admin Yap"}
                        </Button>
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
