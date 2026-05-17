"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, Lock, Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/authStore";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import api from "@/lib/api";

const AVATAR_COLORS = [
  "#3B82F6", "#8B5CF6", "#10B981", "#F59E0B",
  "#EF4444", "#EC4899", "#14B8A6", "#F97316",
];

const THEMES: { id: Theme; label: string; description: string; preview: string }[] = [
  { id: "default", label: "LinkedIn", description: "Profesyonel mavi-beyaz", preview: "#2563EB" },
  { id: "dark", label: "Gece", description: "Koyu, göz dostu", preview: "#1e1e2e" },
  { id: "forest", label: "Orman", description: "Huzurlu yeşil tonlar", preview: "#166534" },
  { id: "sunset", label: "Gün Batımı", description: "Modern mor-pembe", preview: "#7C3AED" },
];

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useTheme();

  const [profile, setProfile] = useState({ firstName: "", lastName: "", gorev: "", avatarColor: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        gorev: user.gorev ?? "",
        avatarColor: user.avatar ?? AVATAR_COLORS[0]!,
      });
    }
  }, [user]);

  const initials = profile.firstName && profile.lastName
    ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    : "?";

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const { data } = await api.put("/users/profile", {
        firstName: profile.firstName,
        lastName: profile.lastName,
        gorev: profile.gorev,
        avatarColor: profile.avatarColor,
      });
      setUser(data.user);
      toast.success("Profil güncellendi!");
    } catch {
      toast.error("Profil güncellenemedi");
    } finally {
      setProfileLoading(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("Yeni şifreler eşleşmiyor");
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error("Şifre en az 6 karakter olmalı");
      return;
    }
    setPasswordLoading(true);
    try {
      await api.put("/users/password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Şifre değiştirildi!");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? "Şifre değiştirilemedi");
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ayarlar</h1>
        <p className="text-muted-foreground mt-1">Hesabını ve görünümünü özelleştir</p>
      </div>

      {/* Profil Bilgileri */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>Profil Bilgileri</CardTitle>
          </div>
          <CardDescription>Ad, soyad ve unvan bilgilerini güncelle</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            {/* Avatar Önizleme + Renk Seçimi */}
            <div className="space-y-3">
              <Label>Avatar Rengi</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 shrink-0">
                  <AvatarFallback
                    className="text-lg font-bold text-white"
                    style={{ backgroundColor: profile.avatarColor || AVATAR_COLORS[0] }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setProfile((p) => ({ ...p, avatarColor: color }))}
                      className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center"
                      style={{
                        backgroundColor: color,
                        borderColor: profile.avatarColor === color ? "#000" : "transparent",
                      }}
                    >
                      {profile.avatarColor === color && <Check className="h-4 w-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ad</Label>
                <Input
                  id="firstName"
                  value={profile.firstName}
                  onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Soyad</Label>
                <Input
                  id="lastName"
                  value={profile.lastName}
                  onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gorev">Görev / Unvan</Label>
              <Input
                id="gorev"
                value={profile.gorev}
                onChange={(e) => setProfile((p) => ({ ...p, gorev: e.target.value }))}
                placeholder="Örn: Frontend Geliştirici"
              />
            </div>

            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? "Kaydediliyor..." : "Profili Kaydet"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Şifre Değiştirme */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <CardTitle>Şifre Değiştir</CardTitle>
          </div>
          <CardDescription>Hesap güvenliğin için güçlü bir şifre seç</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mevcut Şifre</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Yeni Şifre</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                required
                placeholder="En az 6 karakter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                required
              />
            </div>
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tema Seçimi */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle>Tema</CardTitle>
          </div>
          <CardDescription>Arayüzün görünümünü kişiselleştir</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all hover:shadow-sm ${
                  theme === t.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <span
                  className="h-8 w-8 rounded-full shrink-0 border border-border"
                  style={{ backgroundColor: t.preview }}
                />
                <div>
                  <p className="font-medium text-sm">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
                {theme === t.id && <Check className="h-4 w-4 text-primary ml-auto shrink-0" />}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
