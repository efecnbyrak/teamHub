"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [form, setForm] = useState({ email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("accessToken", data.accessToken);
      storage.setItem("refreshToken", data.refreshToken);
      setUser(data.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">TeamHub</CardTitle>
          <CardDescription>Hesabına giriş yap</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@mail.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(!!v)}
              />
              <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer select-none">
                Beni Hatırla
              </Label>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Hesabın yok mu?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Kayıt Ol
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
