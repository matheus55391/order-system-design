"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authService } from "@repo/shared/data-access";
import { useAuthStore } from "@/store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const sessionReady = useAuthStore((state) => state.sessionReady);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    if (!sessionReady) return;

    if (!token && !refreshToken) {
      router.replace("/login");
      return;
    }

    if (!token) {
      setValidated(true);
      return;
    }

    let cancelled = false;

    authService
      .me()
      .then(() => {
        if (!cancelled) setValidated(true);
      })
      .catch(() => {
        if (cancelled) return;
        clearSession();
        router.replace("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [token, refreshToken, sessionReady, router, clearSession]);

  if (!sessionReady || (token && !validated)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-zinc-500">
        Verificando sessão...
      </div>
    );
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
