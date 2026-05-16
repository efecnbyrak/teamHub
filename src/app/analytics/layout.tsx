"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.replace("/login"); return; }
    if (!user) {
      api.get("/auth/me").then(({ data }) => setUser(data.user)).catch(() => router.replace("/login"));
    }
  }, [user, setUser, router]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 bg-muted/20">{children}</main>
    </div>
  );
}
