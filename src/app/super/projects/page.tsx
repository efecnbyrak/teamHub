"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  owner: { id: string; firstName: string; lastName: string; email: string };
  _count: { members: number; tasks: number };
}

export default function SuperProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/super/projects").then(({ data }) => setProjects(data.projects)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Projeler</h1>
        <p className="text-muted-foreground">Sistemdeki tüm projeler</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proje Listesi ({projects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Yükleniyor...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4">Proje Adı</th>
                    <th className="text-left py-2 pr-4">Sahip</th>
                    <th className="text-left py-2 pr-4">Üye</th>
                    <th className="text-left py-2 pr-4">Görev</th>
                    <th className="text-left py-2">Oluşturulma</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3 pr-4 font-medium">{p.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{p.owner.firstName} {p.owner.lastName}</td>
                      <td className="py-3 pr-4">{p._count.members}</td>
                      <td className="py-3 pr-4">{p._count.tasks}</td>
                      <td className="py-3 text-muted-foreground">{format(new Date(p.createdAt), "d MMM yyyy", { locale: tr })}</td>
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
