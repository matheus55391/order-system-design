"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const sessionReady = useAuthStore((state) => state.sessionReady);

  useEffect(() => {
    if (!sessionReady) return;
    if (!token && !refreshToken) {
      router.replace("/login");
    }
  }, [token, refreshToken, sessionReady, router]);

  if (!sessionReady) {
    return null;
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-zinc-500">
        Redirecionando...
      </div>
    );
  }

  return <>{children}</>;
}
