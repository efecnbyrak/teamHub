"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("accessToken")) {
      localStorage.setItem("pendingInvite", token);
      router.push("/login");
    }
  }, [token, router]);

  async function handleJoin() {
    setLoading(true);
    try {
      const { data } = await api.post(`/projects/join/${token}`);
      setJoined(true);
      toast.success(`'${data.project.name}' projesine katıldın!`);
      setTimeout(() => router.push(`/projects/${data.project.id}`), 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || "Katılım başarısız");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Projeye Katıl</CardTitle>
          <CardDescription>Bir davet linki aracılığıyla buraya geldin.</CardDescription>
        </CardHeader>
        <CardContent>
          {joined ? (
            <p className="text-center text-sm text-green-600 font-medium">Projeye katıldın! Yönlendiriliyor...</p>
          ) : (
            <Button className="w-full" onClick={handleJoin} disabled={loading}>
              {loading ? "Katılınıyor..." : "Projeye Katıl"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
