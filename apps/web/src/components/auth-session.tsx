"use client";

import { useEffect } from "react";
import { isTokenExpired } from "@/lib/auth-token";
import { authService } from "@repo/shared/data-access";
import { useAuthStore } from "@/store";

export function AuthSession({ children }: { children: React.ReactNode }) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const sessionReady = useAuthStore((state) => state.sessionReady);

  useEffect(() => {
    if (!hasHydrated) return;

    async function restoreSession() {
      const { token, refreshToken, setSession, clearSession, setSessionReady } =
        useAuthStore.getState();

      if (!token && !refreshToken) {
        setSessionReady(true);
        return;
      }

      if (token && !isTokenExpired(token)) {
        setSessionReady(true);
        return;
      }

      if (!refreshToken) {
        clearSession();
        setSessionReady(true);
        return;
      }

      try {
        const data = await authService.refresh({ refreshToken });
        setSession(data.token, data.refreshToken, data.user);
      } catch {
        clearSession();
      } finally {
        setSessionReady(true);
      }
    }

    if (!sessionReady) {
      void restoreSession();
    }
  }, [hasHydrated, sessionReady]);

  if (!hasHydrated || !sessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-zinc-500">
        Carregando sessão...
      </div>
    );
  }

  return <>{children}</>;
}
