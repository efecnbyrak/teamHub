"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import SuperSidebar from "@/components/SuperSidebar";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function SuperLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuthStore();

  const isLoginPage = pathname === "/super/login";

  useEffect(() => {
    if (isLoginPage) return;

    const token = localStorage.getItem("accessToken");
    if (!token) { router.replace("/super/login"); return; }

    if (!user) {
      api.get("/auth/me")
        .then(({ data }) => {
          if (data.user.role !== "super_admin") {
            router.replace("/super/login");
          } else {
            setUser(data.user);
          }
        })
        .catch(() => router.replace("/super/login"));
    } else if (user.role !== "super_admin") {
      router.replace("/super/login");
    }
  }, [user, setUser, router, isLoginPage]);

  if (isLoginPage) return <>{children}</>;

  if (!user || user.role !== "super_admin") {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SuperSidebar />
      <main className="flex-1 overflow-y-auto p-6 bg-muted/20">{children}</main>
    </div>
  );
}
