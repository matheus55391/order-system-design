import type { AuthUser } from "@repo/shared";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type AuthUserWithTenant = AuthUser & {
  tenant: { id: string; name: string; slug: string };
};

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUserWithTenant | null;
  hasHydrated: boolean;
  sessionReady: boolean;
  setHasHydrated: () => void;
  setSessionReady: (ready: boolean) => void;
  setSession: (
    token: string,
    refreshToken: string,
    user: AuthUserWithTenant,
  ) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      hasHydrated: false,
      sessionReady: false,
      setHasHydrated: () => set({ hasHydrated: true }),
      setSessionReady: (ready) => set({ sessionReady: ready }),
      setSession: (token, refreshToken, user) =>
        set({ token, refreshToken, user, sessionReady: true }),
      clearSession: () =>
        set({
          token: null,
          refreshToken: null,
          user: null,
          sessionReady: true,
        }),
    }),
    {
      name: "order-system-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated();
      },
    },
  ),
);
