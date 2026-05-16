"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  creator: { id: string; firstName: string; lastName: string; email: string };
  _count: { members: number; projects: number };
}

export default function SuperTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/super/teams").then(({ data }) => setTeams(data.teams)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Takımlar</h1>
        <p className="text-muted-foreground">Sistemdeki tüm takımlar</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Takım Listesi ({teams.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Yükleniyor...</p>
          ) : teams.length === 0 ? (
            <p className="text-muted-foreground text-sm">Henüz takım oluşturulmamış.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4">Takım Adı</th>
                    <th className="text-left py-2 pr-4">Kurucu</th>
                    <th className="text-left py-2 pr-4">Üye</th>
                    <th className="text-left py-2 pr-4">Proje</th>
                    <th className="text-left py-2">Oluşturulma</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3 pr-4 font-medium">{t.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{t.creator.firstName} {t.creator.lastName}</td>
                      <td className="py-3 pr-4">{t._count.members}</td>
                      <td className="py-3 pr-4">{t._count.projects}</td>
                      <td className="py-3 text-muted-foreground">{format(new Date(t.createdAt), "d MMM yyyy", { locale: tr })}</td>
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
