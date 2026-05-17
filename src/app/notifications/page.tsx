"use client";
import { useEffect, useState, useCallback } from "react";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/api";

interface Notification {
  id: string; type: string; message: string; read: boolean; createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    const { data } = await api.get("/notifications");
    setNotifications(data.notifications);
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  async function markRead(id: string) {
    await api.put(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    await api.put("/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("Tüm bildirimler okundu olarak işaretlendi");
  }

  const unread = notifications.filter((n) => !n.read).length;

  if (loading) return <div className="text-muted-foreground">Yükleniyor...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bildirimler</h1>
          {unread > 0 && <p className="text-sm text-muted-foreground mt-1">{unread} okunmamış bildirim</p>}
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-2" /> Hepsini okundu yap
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Henüz bildiriminiz yok.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`cursor-pointer transition-colors ${!n.read ? "border-primary/30 bg-primary/5" : ""}`}
              onClick={() => { if (!n.read) markRead(n.id); }}
            >
              <CardContent className="flex items-start gap-3 py-3 px-4">
                <div className={`mt-0.5 shrink-0 ${!n.read ? "text-primary" : "text-muted-foreground"}`}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read ? "font-medium" : "text-muted-foreground"}`}>{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(n.createdAt), "d MMMM, HH:mm", { locale: tr })}
                  </p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
