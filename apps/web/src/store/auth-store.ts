import type { AuthUser } from "@repo/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  user: (AuthUser & { tenant: { id: string; name: string; slug: string } }) | null;
  setSession: (
    token: string,
    user: AuthUser & { tenant: { id: string; name: string; slug: string } },
  ) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: null, user: null }),
    }),
    {
      name: "order-system-auth",
    },
  ),
);
